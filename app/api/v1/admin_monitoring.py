"""
Monitoramento do status da aplicação (staff).
=============================================
Retrato do momento: pool de conexões, conexões vistas pelo Postgres e
saúde das dependências (Postgres, Redis, Stripe). Exige role=admin.

As consultas ao Postgres usam um engine próprio, sem pool (NullPool), para que
o monitoramento não dispute conexões com o pool da aplicação justamente quando
ele estiver cheio.
"""

import os
import platform
import time
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.pool import NullPool

from app.api.deps import require_admin_user
from app.core.config import settings
from app.core.rate_limit import get_redis_client
from app.db import session as db_session
from app.db.models import User

router = APIRouter(prefix="/v1/admin/monitoring", tags=["Admin"])

_PROCESS_STARTED_AT = time.time()
_monitor_engine: Optional[Engine] = None

POOL_WARN_RATIO = 0.6
POOL_ERROR_RATIO = 0.9
DB_LATENCY_WARN_MS = 500
OLD_CONNECTION_WARN_SECONDS = db_session.POOL_RECYCLE * 2


class MonitoringBlock(BaseModel):
    status: str  # ok | warn | error | disabled
    error: Optional[str] = None
    data: dict[str, Any] = {}


class MonitoringResponse(BaseModel):
    generated_at: datetime
    app: MonitoringBlock
    pool: MonitoringBlock
    db_connections: MonitoringBlock
    postgres: MonitoringBlock
    redis: MonitoringBlock
    stripe: MonitoringBlock


def _get_monitor_engine() -> Engine:
    global _monitor_engine
    if _monitor_engine is None:
        _monitor_engine = create_engine(
            db_session.DATABASE_URL,
            poolclass=NullPool,
            connect_args={"connect_timeout": 5},
        )
    return _monitor_engine


def _error_block(exc: Exception) -> MonitoringBlock:
    return MonitoringBlock(status="error", error=f"{type(exc).__name__}: {exc}")


def _app_block() -> MonitoringBlock:
    return MonitoringBlock(
        status="ok",
        data={
            "pid": os.getpid(),
            "uptime_seconds": int(time.time() - _PROCESS_STARTED_AT),
            "started_at": datetime.fromtimestamp(_PROCESS_STARTED_AT, tz=timezone.utc).isoformat(),
            "python": platform.python_version(),
            "web_concurrency": os.getenv("WEB_CONCURRENCY"),
        },
    )


def _pool_block() -> MonitoringBlock:
    pool = db_session.engine.pool
    pool_size = db_session.POOL_SIZE
    max_overflow = db_session.POOL_MAX_OVERFLOW
    capacity = pool_size + max_overflow

    checked_out = pool.checkedout()
    checked_in = pool.checkedin()
    overflow_in_use = max(0, pool.overflow())
    usage_ratio = checked_out / capacity if capacity else 0.0
    peak = db_session.pool_peak_checked_out

    status = "ok"
    if usage_ratio >= POOL_ERROR_RATIO:
        status = "error"
    elif usage_ratio >= POOL_WARN_RATIO:
        status = "warn"

    return MonitoringBlock(
        status=status,
        data={
            "pool_size": pool_size,
            "max_overflow": max_overflow,
            "capacity": capacity,
            "timeout_seconds": db_session.POOL_TIMEOUT,
            "recycle_seconds": db_session.POOL_RECYCLE,
            "checked_out": checked_out,
            "checked_in": checked_in,
            "overflow_in_use": overflow_in_use,
            "usage_ratio": round(usage_ratio, 2),
            "peak_checked_out": peak,
            "peak_ratio": round(peak / capacity, 2) if capacity else 0.0,
            "note": "Valores deste processo (pid). Cada worker tem o seu próprio pool.",
        },
    )


_DB_CONNECTIONS_SQL = text(
    """
    SELECT
        count(*) FILTER (WHERE state = 'active') AS active,
        count(*) FILTER (WHERE state = 'idle') AS idle,
        count(*) FILTER (WHERE state LIKE 'idle in transaction%') AS idle_in_transaction,
        count(*) AS total,
        COALESCE(max(EXTRACT(EPOCH FROM (now() - backend_start))), 0) AS oldest_connection_seconds,
        COALESCE(
            max(EXTRACT(EPOCH FROM (now() - xact_start)))
                FILTER (WHERE state LIKE 'idle in transaction%'),
            0
        ) AS oldest_idle_in_transaction_seconds
    FROM pg_stat_activity
    WHERE datname = current_database()
      AND backend_type = 'client backend'
      AND pid <> pg_backend_pid()
    """
)

_PG_SETTINGS_SQL = text(
    """
    SELECT name, setting, unit
    FROM pg_settings
    WHERE name IN ('max_connections', 'shared_buffers', 'work_mem')
    """
)


def _format_pg_setting(name: str, setting: str, unit: Optional[str]) -> str:
    if name == "max_connections":
        return setting
    # shared_buffers vem em páginas de 8kB; work_mem em kB
    try:
        value = int(setting)
    except ValueError:
        return setting
    kb = value * 8 if unit == "8kB" else value
    return f"{kb // 1024} MB" if kb >= 1024 else f"{kb} kB"


def _db_blocks() -> tuple[MonitoringBlock, MonitoringBlock]:
    """Retorna (db_connections, postgres) usando uma única conexão de monitoramento."""
    try:
        started = time.perf_counter()
        with _get_monitor_engine().connect() as conn:
            conn.execute(text("SELECT set_config('statement_timeout', '3s', true)"))
            conn.execute(text("SELECT 1"))
            latency_ms = round((time.perf_counter() - started) * 1000, 1)
            conn_row = conn.execute(_DB_CONNECTIONS_SQL).mappings().one()
            settings_rows = conn.execute(_PG_SETTINGS_SQL).all()
    except Exception as exc:
        block = _error_block(exc)
        return block, block

    pg_settings = {
        name: _format_pg_setting(name, setting, unit) for name, setting, unit in settings_rows
    }
    max_connections = int(pg_settings.get("max_connections", 0) or 0)

    oldest = float(conn_row["oldest_connection_seconds"])
    idle_tx = int(conn_row["idle_in_transaction"])
    conn_status = "ok"
    if idle_tx > 0 or oldest > OLD_CONNECTION_WARN_SECONDS:
        conn_status = "warn"

    db_connections = MonitoringBlock(
        status=conn_status,
        data={
            "active": int(conn_row["active"]),
            "idle": int(conn_row["idle"]),
            "idle_in_transaction": idle_tx,
            "total": int(conn_row["total"]),
            "max_connections": max_connections,
            "oldest_connection_seconds": int(oldest),
            "oldest_idle_in_transaction_seconds": int(conn_row["oldest_idle_in_transaction_seconds"]),
            "recycle_seconds": db_session.POOL_RECYCLE,
            "note": "Exclui a conexão do próprio monitoramento.",
        },
    )

    postgres = MonitoringBlock(
        status="warn" if latency_ms >= DB_LATENCY_WARN_MS else "ok",
        data={
            "latency_ms": latency_ms,
            "shared_buffers": pg_settings.get("shared_buffers"),
            "work_mem": pg_settings.get("work_mem"),
            "max_connections": max_connections,
        },
    )
    return db_connections, postgres


def _redis_block() -> MonitoringBlock:
    if not settings.REDIS_ENABLED:
        return MonitoringBlock(
            status="disabled",
            data={"enabled": False, "note": "REDIS_ENABLED=false: rate limit desativado."},
        )

    try:
        client = get_redis_client()
        if client is None:
            return MonitoringBlock(
                status="error",
                error=(
                    "Redis habilitado, mas sem conexão. A conexão só é tentada uma vez por "
                    "processo; o rate limit está desativado até reiniciar o app."
                ),
                data={"enabled": True, "connected": False},
            )
        started = time.perf_counter()
        client.ping()
        latency_ms = round((time.perf_counter() - started) * 1000, 1)
        return MonitoringBlock(
            status="warn" if latency_ms >= DB_LATENCY_WARN_MS else "ok",
            data={"enabled": True, "connected": True, "latency_ms": latency_ms},
        )
    except Exception as exc:
        block = _error_block(exc)
        block.data = {"enabled": True, "connected": False}
        return block


def _stripe_block() -> MonitoringBlock:
    checks = {
        "secret_key": bool(settings.STRIPE_SECRET_KEY),
        "webhook_secret": bool(settings.STRIPE_WEBHOOK_SECRET),
        "price_starter": bool(settings.STRIPE_PRICE_STARTER),
        "price_pro": bool(settings.STRIPE_PRICE_PRO),
        "price_advanced": bool(settings.STRIPE_PRICE_ADVANCED),
        "price_enterprise": bool(settings.STRIPE_PRICE_ENTERPRISE),
    }
    essential_ok = checks["secret_key"] and checks["webhook_secret"]
    all_ok = all(checks.values())
    status = "ok" if all_ok else ("warn" if essential_ok else "error")
    return MonitoringBlock(
        status=status,
        data={
            "configured": checks,
            "note": "Apenas configuração; nenhuma chamada à API do Stripe é feita.",
        },
    )


@router.get(
    "",
    response_model=MonitoringResponse,
    summary="Status da aplicação",
    description=(
        "Retrato do momento: pool de conexões deste processo, conexões vistas pelo Postgres e "
        "saúde de Postgres, Redis e Stripe. Cada bloco falha de forma independente."
    ),
)
def get_monitoring(admin: User = Depends(require_admin_user)) -> MonitoringResponse:
    db_connections, postgres = _db_blocks()
    return MonitoringResponse(
        generated_at=datetime.now(timezone.utc),
        app=_app_block(),
        pool=_pool_block(),
        db_connections=db_connections,
        postgres=postgres,
        redis=_redis_block(),
        stripe=_stripe_block(),
    )
