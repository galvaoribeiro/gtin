"""
Rate Limiter simples em memória para endpoints públicos.
=========================================================
Implementa limite diário até 00:00 (America/Sao_Paulo ou UTC-3 fallback).
"""

import time
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from typing import Dict, Tuple
from fastapi import HTTPException, Request, status


def _get_sao_paulo_tz() -> timezone:
    """
    Tenta carregar o fuso America/Sao_Paulo via IANA.
    Em ambientes sem tzdata (ex.: Windows), faz fallback para UTC-3 fixo.
    """
    try:
        return ZoneInfo("America/Sao_Paulo")
    except ZoneInfoNotFoundError:
        return timezone(timedelta(hours=-3))


class InMemoryRateLimiter:
    """
    Rate limiter simples em memória.
    - Apenas limite diário (ex.: 15 por IP) com bloqueio até 00:00 America/Sao_Paulo
    """
    
    def __init__(self, daily_limit: int):
        """
        Args:
            daily_limit: Limite diário por IP antes de bloquear até meia-noite
        """
        self.daily_limit = daily_limit
        self.daily_usage: Dict[str, Tuple[str, int]] = {}  # ip -> (date_iso, count)
        self.blocked_until: Dict[str, float] = {}  # ip -> epoch seconds
        self.tz = _get_sao_paulo_tz()
    
    def _reset_if_new_day(self, ip: str, now_local: datetime) -> None:
        """Zera contagem e bloqueio se mudou o dia em São Paulo."""
        today = now_local.date().isoformat()
        date_count = self.daily_usage.get(ip)
        if date_count is None or date_count[0] != today:
            self.daily_usage[ip] = (today, 0)
            self.blocked_until.pop(ip, None)
    
    def _seconds_until_midnight(self, now_local: datetime) -> float:
        """Calcula segundos até 00:00 da próxima madrugada em São Paulo."""
        tomorrow = (now_local + timedelta(days=1)).date()
        midnight = datetime.combine(tomorrow, datetime.min.time(), tzinfo=self.tz)
        return (midnight - now_local).total_seconds()
    
    def check_rate_limit(self, ip: str) -> Tuple[bool, int, bool, float]:
        """
        Verifica se o IP excedeu limites.
        
        Returns:
            allowed: se a requisição pode prosseguir
            remaining_daily: quantas restam no limite diário
            blocked_daily: se o IP está bloqueado até a meia-noite
            retry_after: segundos até liberar (meia-noite)
        """
        now_ts = time.time()
        now_local = datetime.now(self.tz)
        
        # Reset diário se mudou o dia
        self._reset_if_new_day(ip, now_local)
        
        # Bloqueio diário já aplicado
        if ip in self.blocked_until:
            retry_after = max(self.blocked_until[ip] - now_ts, 0)
            return False, 0, True, retry_after
        
        # Limite diário
        date_str, daily_count = self.daily_usage.get(ip, (now_local.date().isoformat(), 0))
        if daily_count >= self.daily_limit:
            retry_after = self._seconds_until_midnight(now_local)
            self.blocked_until[ip] = now_ts + retry_after
            return False, 0, True, retry_after
        
        # Registrar requisição
        self.daily_usage[ip] = (date_str, daily_count + 1)
        remaining_daily = max(self.daily_limit - (daily_count + 1), 0)
        
        return True, remaining_daily, False, 0.0
    
    def get_client_ip(self, request: Request) -> str:
        """
        Extrai o IP do cliente da requisição.
        Considera X-Forwarded-For se presente (proxy/load balancer).
        """
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"


# Configuração pública: 15 requisições por dia, bloqueio até 00:00 America/Sao_Paulo
public_rate_limiter = InMemoryRateLimiter(daily_limit=15)


def check_public_rate_limit(request: Request) -> str:
    """
    Dependency para FastAPI que verifica rate limit de endpoints públicos.
    Raises 429 quando o limite diário é excedido.
    """
    ip = public_rate_limiter.get_client_ip(request)
    allowed, remaining_daily, blocked_daily, retry_after = public_rate_limiter.check_rate_limit(ip)
    
    if not allowed and blocked_daily:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Você atingiu o limite diário para visitantes anônimos. "
                   "Para continuar consultando gratuitamente, crie sua conta gratuita.",
            headers={
                "Retry-After": str(int(retry_after)),
                "X-RateLimit-Remaining": "0",
            },
        )
    
    return ip


