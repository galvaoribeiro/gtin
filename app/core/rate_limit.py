"""
Rate Limiter simples em memória para endpoints públicos.
=========================================================
Implementação básica de rate limit por IP.
"""

import time
from collections import defaultdict
from typing import Dict, Tuple
from fastapi import HTTPException, Request, status


class InMemoryRateLimiter:
    """
    Rate limiter simples em memória.
    Armazena timestamps de requisições por IP.
    """
    
    def __init__(self, max_requests: int, window_seconds: int):
        """
        Args:
            max_requests: Número máximo de requisições permitidas
            window_seconds: Janela de tempo em segundos
        """
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        # Dict[IP, List[timestamp]]
        self.requests: Dict[str, list[float]] = defaultdict(list)
    
    def _clean_old_requests(self, ip: str, current_time: float) -> None:
        """Remove requisições antigas fora da janela de tempo."""
        cutoff = current_time - self.window_seconds
        self.requests[ip] = [ts for ts in self.requests[ip] if ts > cutoff]
    
    def check_rate_limit(self, ip: str) -> Tuple[bool, int]:
        """
        Verifica se o IP excedeu o rate limit.
        
        Returns:
            Tuple[allowed, remaining]: (True se permitido, requisições restantes)
        """
        current_time = time.time()
        
        # Limpar requisições antigas
        self._clean_old_requests(ip, current_time)
        
        # Contar requisições na janela
        request_count = len(self.requests[ip])
        
        if request_count >= self.max_requests:
            return False, 0
        
        # Registrar esta requisição
        self.requests[ip].append(current_time)
        
        return True, self.max_requests - request_count - 1
    
    def get_client_ip(self, request: Request) -> str:
        """
        Extrai o IP do cliente da requisição.
        Considera X-Forwarded-For se presente (proxy/load balancer).
        """
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            # Pegar o primeiro IP da lista (cliente real)
            return forwarded.split(",")[0].strip()
        
        # Fallback para IP direto
        return request.client.host if request.client else "unknown"


# Instância global para endpoints públicos: 30 req/min
public_rate_limiter = InMemoryRateLimiter(max_requests=3, window_seconds=60)


def check_public_rate_limit(request: Request) -> str:
    """
    Dependency para FastAPI que verifica rate limit de endpoints públicos.
    
    Returns:
        IP do cliente (para logging se necessário)
    
    Raises:
        HTTPException 429 se rate limit excedido
    """
    ip = public_rate_limiter.get_client_ip(request)
    allowed, remaining = public_rate_limiter.check_rate_limit(ip)
    
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit excedido. Tente novamente em alguns instantes.",
            headers={"X-RateLimit-Remaining": "0"}
        )
    
    return ip

