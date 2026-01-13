"""
Rate Limiter com Redis para endpoints públicos e autenticados.
==============================================================
Implementa rate limits por organização (autenticados) e por IP (público).

- Lookup (/{gtin}, /batch): req/min por plano
- Search (/search): cooldown em segundos por plano
- Público: 15 req/dia por IP + cooldown entre requisições
"""

import time
import logging
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from typing import Optional, Tuple

import redis
from fastapi import Depends, HTTPException, Request, status

from app.core.config import settings

logger = logging.getLogger(__name__)


# =============================================================================
# Rate limit configurations por plano
# =============================================================================

# Lookup endpoints: /{gtin} e /batch (requests por minuto)
LOOKUP_RATE_LIMITS = {
    "basic": 30,      # basic não acessa API, mas fica mapeado
    "starter": 60,
    "pro": 90,
    "advanced": 120,
}

# Search endpoint: /search (cooldown em segundos entre requests)
SEARCH_COOLDOWNS = {
    "basic": 12,      # 1 req a cada 12s
    "starter": 6,     # 1 req a cada 6s
    "pro": 4,         # 1 req a cada 4s
    "advanced": 2,    # 1 req a cada 2s
}

# Público: limites por IP
PUBLIC_DAILY_LIMIT = 20  # até o final do dia (America/Sao_Paulo)
PUBLIC_COOLDOWN_SECONDS = 5  # delay entre chamadas para desincentivar scraping


# =============================================================================
# Redis connection singleton
# =============================================================================

_redis_client: Optional[redis.Redis] = None


def get_redis_client() -> Optional[redis.Redis]:
    """
    Retorna uma conexão Redis singleton.
    Retorna None se Redis não estiver habilitado ou não conseguir conectar.
    """
    global _redis_client
    
    if not settings.REDIS_ENABLED:
        return None
    
    if _redis_client is None:
        try:
            _redis_client = redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2,
            )
            # Testar conexão
            _redis_client.ping()
            logger.info("Redis conectado com sucesso: %s", settings.REDIS_URL.split("@")[-1])
        except redis.RedisError as e:
            logger.warning("Não foi possível conectar ao Redis: %s. Rate limiting desabilitado.", e)
            _redis_client = None
    
    return _redis_client


# =============================================================================
# Funções de fuso horário (reset diário em America/Sao_Paulo)
# =============================================================================


def _get_sao_paulo_tz() -> timezone:
    try:
        return ZoneInfo("America/Sao_Paulo")
    except ZoneInfoNotFoundError:
        return timezone(timedelta(hours=-3))


def _seconds_until_midnight_sao_paulo() -> int:
    tz = _get_sao_paulo_tz()
    now_local = datetime.now(tz)
    tomorrow = (now_local + timedelta(days=1)).date()
    midnight = datetime.combine(tomorrow, datetime.min.time(), tzinfo=tz)
    return max(int((midnight - now_local).total_seconds()), 1)


# =============================================================================
# Lua scripts para operações atômicas
# =============================================================================

# Sliding window rate limit script (contador por janela de 60s)
SLIDING_WINDOW_SCRIPT = """
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

-- Remove entradas expiradas
redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window)

-- Conta entradas atuais
local count = redis.call('ZCARD', key)

if count < limit then
    -- Adiciona nova entrada
    redis.call('ZADD', key, now, now .. ':' .. math.random())
    redis.call('EXPIRE', key, window)
    return {1, limit - count - 1, 0}  -- allowed, remaining, retry_after
else
    -- Pega o timestamp mais antigo para calcular retry_after
    local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
    local retry_after = 0
    if oldest and oldest[2] then
        retry_after = math.ceil(window - (now - tonumber(oldest[2])))
        if retry_after < 0 then retry_after = 0 end
    end
    return {0, 0, retry_after}  -- blocked, remaining=0, retry_after
end
"""


# =============================================================================
# RedisRateLimiter class
# =============================================================================

class RedisRateLimiter:
    """
    Rate limiter usando Redis como backend.
    Suporta múltiplas instâncias (containers) com estado compartilhado.
    """
    
    def __init__(self):
        self._sliding_window_sha: Optional[str] = None
    
    def _get_script_sha(self, client: redis.Redis) -> str:
        """Carrega e cacheia o script Lua."""
        if self._sliding_window_sha is None:
            self._sliding_window_sha = client.script_load(SLIDING_WINDOW_SCRIPT)
        return self._sliding_window_sha
    
    def check_sliding_window(
        self,
        key: str,
        limit: int,
        window_seconds: int = 60,
    ) -> Tuple[bool, int, int]:
        """
        Verifica rate limit usando sliding window.
        
        Args:
            key: Chave Redis para o rate limit
            limit: Número máximo de requests na janela
            window_seconds: Tamanho da janela em segundos
        
        Returns:
            (allowed, remaining, retry_after_seconds)
        """
        client = get_redis_client()
        if client is None:
            # Redis não disponível: permite request (fail-open)
            return True, limit, 0
        
        try:
            now = time.time()
            script_sha = self._get_script_sha(client)
            result = client.evalsha(
                script_sha,
                1,  # número de keys
                key,
                limit,
                window_seconds,
                now,
            )
            allowed = bool(result[0])
            remaining = int(result[1])
            retry_after = int(result[2])
            return allowed, remaining, retry_after
        except redis.RedisError as e:
            logger.warning("Redis error em sliding_window: %s", e)
            # Fail-open: permite request se Redis falhar
            return True, limit, 0
    
    def check_cooldown(
        self,
        key: str,
        cooldown_seconds: int,
    ) -> Tuple[bool, int]:
        """
        Verifica cooldown (1 request a cada N segundos).
        Usa SET NX EX para lock atômico.
        
        Args:
            key: Chave Redis para o cooldown
            cooldown_seconds: Segundos entre requests permitidos
        
        Returns:
            (allowed, retry_after_seconds)
        """
        client = get_redis_client()
        if client is None:
            return True, 0
        
        try:
            # SET NX EX: só seta se não existir, com expiração
            set_result = client.set(key, "1", nx=True, ex=cooldown_seconds)
            
            if set_result:
                # Lock adquirido: request permitido
                return True, 0
            else:
                # Lock existe: request bloqueado
                ttl = client.ttl(key)
                retry_after = max(ttl, 1) if ttl > 0 else cooldown_seconds
                return False, retry_after
        except redis.RedisError as e:
            logger.warning("Redis error em cooldown: %s", e)
            return True, 0

    def check_daily_limit_until_midnight(
        self,
        key: str,
        daily_limit: int,
    ) -> Tuple[bool, int, int]:
        """
        Limite diário com reset na meia-noite de São Paulo.

        Returns:
            (allowed, remaining, retry_after_seconds)
        """
        client = get_redis_client()
        if client is None:
            return True, daily_limit, 0

        try:
            count = client.incr(key)
            if count == 1:
                client.expire(key, _seconds_until_midnight_sao_paulo())

            if count <= daily_limit:
                remaining = max(daily_limit - int(count), 0)
                return True, remaining, 0

            ttl = client.ttl(key)
            retry_after = (
                max(int(ttl), 1)
                if ttl and ttl > 0
                else _seconds_until_midnight_sao_paulo()
            )
            return False, 0, retry_after
        except redis.RedisError as e:
            logger.warning("Redis error em daily_limit: %s", e)
            return True, daily_limit, 0


# Singleton do rate limiter
redis_rate_limiter = RedisRateLimiter()


# =============================================================================
# Helper functions
# =============================================================================

def get_client_ip(request: Request) -> str:
    """
    Extrai o IP do cliente da requisição.
    Considera X-Forwarded-For se presente (proxy/load balancer).
    """
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _raise_rate_limit_exceeded(
    limit: int,
    remaining: int,
    retry_after: int,
    message: str,
) -> None:
    """Levanta HTTPException 429 com headers padronizados."""
    raise HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail=message,
        headers={
            "Retry-After": str(retry_after),
            "X-RateLimit-Limit": str(limit),
            "X-RateLimit-Remaining": str(remaining),
        },
    )


# =============================================================================
# FastAPI Dependencies para rate limit
# =============================================================================

def check_public_rate_limit(request: Request) -> str:
    """
    Dependency para rate limit de endpoints públicos.
    Limite: 15 req/dia por IP + cooldown entre requisições.
    
    Returns:
        IP do cliente (para logging/métricas)
    
    Raises:
        HTTPException 429 se limite excedido
    """
    ip = get_client_ip(request)

    # 1) Cooldown (delay) por IP
    cooldown_key = f"rl:ip:{ip}:public:cooldown"
    allowed, retry_after = redis_rate_limiter.check_cooldown(
        key=cooldown_key,
        cooldown_seconds=PUBLIC_COOLDOWN_SECONDS,
    )
    if not allowed:
        _raise_rate_limit_exceeded(
            limit=1,
            remaining=0,
            retry_after=retry_after,
            message="Acesso público é limitado. Aguarde alguns segundos ou crie uma conta para acesso completo.",
        )

    # 2) Limite diário até a meia-noite (America/Sao_Paulo)
    daily_key = f"rl:ip:{ip}:public:daily"
    allowed, remaining, retry_after = redis_rate_limiter.check_daily_limit_until_midnight(
        key=daily_key,
        daily_limit=PUBLIC_DAILY_LIMIT,
    )

    if not allowed:
        _raise_rate_limit_exceeded(
            limit=PUBLIC_DAILY_LIMIT,
            remaining=remaining,
            retry_after=retry_after,
            message="Você atingiu o limite diário do endpoint público. Assine um plano para acesso completo à API.",
        )

    return ip


# =============================================================================
# Dependencies para endpoints autenticados (precisam do ApiKeyAuth)
# =============================================================================

# Import aqui para evitar circular import - será usado via Depends
# O auth já terá sido resolvido antes dessas dependencies rodarem

def check_org_rate_limit_lookup(request: Request) -> None:
    """
    Dependency para rate limit de endpoints lookup (/{gtin}, /batch).
    Deve ser usado DEPOIS de get_api_key_auth resolver o auth.
    
    Limite: varia por plano (30-120 req/min por organização)
    
    Raises:
        HTTPException 429 se limite excedido
    """
    # Pega org do request.state (setado por get_api_key_auth indiretamente)
    # ou do auth que será passado via parâmetro
    from app.api.deps import get_api_key_auth, ApiKeyAuth
    
    # Esta dependency precisa ser chamada com auth já resolvido
    # Vamos pegar via request.state se disponível
    auth: Optional[ApiKeyAuth] = getattr(request.state, "auth", None)
    
    if auth is None:
        # Fallback: não temos auth ainda, não podemos verificar
        # Isso não deveria acontecer se a ordem de dependencies estiver correta
        logger.warning("check_org_rate_limit_lookup chamado sem auth no request.state")
        return
    
    org = auth.organization
    plan = org.plan
    limit = LOOKUP_RATE_LIMITS.get(plan, LOOKUP_RATE_LIMITS["starter"])
    
    key = f"rl:org:{org.id}:lookup"
    
    allowed, remaining, retry_after = redis_rate_limiter.check_sliding_window(
        key=key,
        limit=limit,
        window_seconds=60,
    )
    
    if not allowed:
        _raise_rate_limit_exceeded(
            limit=limit,
            remaining=remaining,
            retry_after=retry_after,
            message=f"Limite de {limit} requisições/minuto excedido para seu plano ({plan}). Aguarde {retry_after}s.",
        )


def check_org_rate_limit_search(request: Request) -> None:
    """
    Dependency para rate limit de endpoint search (/search).
    Deve ser usado DEPOIS de get_api_key_auth resolver o auth.
    
    Limite: cooldown varia por plano (2-12 segundos entre requests por organização)
    
    Raises:
        HTTPException 429 se limite excedido
    """
    from app.api.deps import ApiKeyAuth
    
    auth: Optional[ApiKeyAuth] = getattr(request.state, "auth", None)
    
    if auth is None:
        logger.warning("check_org_rate_limit_search chamado sem auth no request.state")
        return
    
    org = auth.organization
    plan = org.plan
    cooldown = SEARCH_COOLDOWNS.get(plan, SEARCH_COOLDOWNS["starter"])
    
    key = f"rl:org:{org.id}:search"
    
    allowed, retry_after = redis_rate_limiter.check_cooldown(
        key=key,
        cooldown_seconds=cooldown,
    )
    
    if not allowed:
        _raise_rate_limit_exceeded(
            limit=1,
            remaining=0,
            retry_after=retry_after,
            message=f"Aguarde {retry_after}s entre pesquisas. Seu plano ({plan}) permite 1 pesquisa a cada {cooldown}s.",
        )


# =============================================================================
# Factory para criar dependency com auth injetado
# =============================================================================

def get_rate_limit_lookup_dependency():
    """
    Retorna uma dependency que verifica rate limit de lookup.
    Usa closure para capturar o auth do contexto.
    """
    from app.api.deps import get_api_key_auth, ApiKeyAuth
    
    async def _check_lookup_rate_limit(
        request: Request,
        auth: ApiKeyAuth = Depends(get_api_key_auth),
    ) -> ApiKeyAuth:
        """
        Verifica rate limit de lookup e retorna auth.
        Armazena auth no request.state para uso posterior.
        """
        # Armazenar auth no request.state
        request.state.auth = auth
        
        org = auth.organization
        plan = org.plan
        limit = LOOKUP_RATE_LIMITS.get(plan, LOOKUP_RATE_LIMITS["starter"])
        
        key = f"rl:org:{org.id}:lookup"
        
        allowed, remaining, retry_after = redis_rate_limiter.check_sliding_window(
            key=key,
            limit=limit,
            window_seconds=60,
        )
        
        if not allowed:
            _raise_rate_limit_exceeded(
                limit=limit,
                remaining=remaining,
                retry_after=retry_after,
                message=f"Limite de {limit} requisições/minuto excedido para seu plano ({plan}). Aguarde {retry_after}s.",
            )
        
        return auth
    
    return _check_lookup_rate_limit


def get_rate_limit_search_dependency():
    """
    Retorna uma dependency que verifica rate limit de search.
    """
    from app.api.deps import get_api_key_auth, ApiKeyAuth
    
    async def _check_search_rate_limit(
        request: Request,
        auth: ApiKeyAuth = Depends(get_api_key_auth),
    ) -> ApiKeyAuth:
        """
        Verifica rate limit de search e retorna auth.
        """
        request.state.auth = auth
        
        org = auth.organization
        plan = org.plan
        cooldown = SEARCH_COOLDOWNS.get(plan, SEARCH_COOLDOWNS["starter"])
        
        key = f"rl:org:{org.id}:search"
        
        allowed, retry_after = redis_rate_limiter.check_cooldown(
            key=key,
            cooldown_seconds=cooldown,
        )
        
        if not allowed:
            _raise_rate_limit_exceeded(
                limit=1,
                remaining=0,
                retry_after=retry_after,
                message=f"Aguarde {retry_after}s entre pesquisas. Seu plano ({plan}) permite 1 pesquisa a cada {cooldown}s.",
            )
        
        return auth
    
    return _check_search_rate_limit


# Criar as dependencies prontas para uso
rate_limit_lookup = get_rate_limit_lookup_dependency()
rate_limit_search = get_rate_limit_search_dependency()
