"""
Serviço de registro de uso de API Keys.
=======================================
Registra chamadas de API por dia com contagem de sucesso/erro.
"""

from datetime import date, datetime
import pytz

from sqlalchemy import text
from sqlalchemy.orm import Session

from fastapi import HTTPException, status


# Fuso horário de São Paulo
SAO_PAULO_TZ = pytz.timezone("America/Sao_Paulo")


def get_today_sao_paulo() -> date:
    """
    Retorna a data atual no fuso horário de São Paulo.
    
    Returns:
        Date no fuso America/Sao_Paulo.
    """
    return datetime.now(SAO_PAULO_TZ).date()


def get_current_month_start_sao_paulo() -> date:
    """
    Retorna a data representando o primeiro dia do mês corrente no fuso horário de São Paulo.
    """
    now = datetime.now(SAO_PAULO_TZ)
    return date(year=now.year, month=now.month, day=1)


def record_api_usage(
    db: Session,
    api_key_id: int,
    status_code: int,
) -> None:
    """
    Registra uma chamada de API na tabela de uso diário.
    
    Faz upsert incremental: se já existe registro para api_key_id+data,
    incrementa o contador apropriado (sucesso ou erro).
    
    Args:
        db: Sessão do banco de dados
        api_key_id: ID da API key utilizada
        status_code: Código HTTP da resposta (2xx = sucesso, outros = erro)
    """
    today = get_today_sao_paulo()
    is_success = 200 <= status_code < 300
    
    # Usar upsert com ON CONFLICT para garantir atomicidade
    if is_success:
        query = text("""
            INSERT INTO api_key_usage_daily (api_key_id, usage_date, success_count, error_count)
            VALUES (:api_key_id, :usage_date, 1, 0)
            ON CONFLICT (api_key_id, usage_date)
            DO UPDATE SET success_count = api_key_usage_daily.success_count + 1
        """)
    else:
        query = text("""
            INSERT INTO api_key_usage_daily (api_key_id, usage_date, success_count, error_count)
            VALUES (:api_key_id, :usage_date, 0, 1)
            ON CONFLICT (api_key_id, usage_date)
            DO UPDATE SET error_count = api_key_usage_daily.error_count + 1
        """)
    
    db.execute(query, {"api_key_id": api_key_id, "usage_date": today})
    db.commit()


def record_api_usage_batch(
    db: Session,
    api_key_id: int,
    success_count: int,
    error_count: int,
) -> None:
    """
    Registra múltiplas chamadas de API na tabela de uso diário.
    
    Útil para endpoints em lote (batch) onde várias consultas são feitas em uma única request.
    """
    today = get_today_sao_paulo()
    
    query = text("""
        INSERT INTO api_key_usage_daily (api_key_id, usage_date, success_count, error_count)
        VALUES (:api_key_id, :usage_date, :success_count, :error_count)
        ON CONFLICT (api_key_id, usage_date)
        DO UPDATE SET 
            success_count = api_key_usage_daily.success_count + :success_count,
            error_count = api_key_usage_daily.error_count + :error_count
    """)
    
    db.execute(query, {
        "api_key_id": api_key_id,
        "usage_date": today,
        "success_count": success_count,
        "error_count": error_count,
    })
    db.commit()


def get_organization_daily_usage(db: Session, organization_id: int) -> int:
    """
    Retorna o total de chamadas (sucesso + erro) da organização no dia atual.
    """
    today = get_today_sao_paulo()
    query = text("""
        SELECT COALESCE(SUM(u.success_count + u.error_count), 0) AS total
        FROM api_key_usage_daily u
        JOIN api_keys ak ON ak.id = u.api_key_id
        WHERE ak.organization_id = :org_id
          AND u.usage_date = :usage_date
    """)
    total = db.execute(query, {"org_id": organization_id, "usage_date": today}).scalar()
    return int(total or 0)


# =============================================================================
# Uso mensal por organização
# =============================================================================


def record_org_usage_monthly(
    db: Session,
    organization_id: int,
    status_code: int,
) -> None:
    """
    Registra uma chamada de API na tabela de uso mensal por organização.
    Faz upsert incremental: se já existe registro para org+mês, incrementa sucesso/erro.
    """
    usage_month = get_current_month_start_sao_paulo()
    is_success = 200 <= status_code < 300

    success_inc = 1 if is_success else 0
    error_inc = 0 if is_success else 1

    query = text("""
        INSERT INTO organization_usage_monthly (organization_id, usage_month, success_count, error_count)
        VALUES (:organization_id, :usage_month, :success_inc, :error_inc)
        ON CONFLICT (organization_id, usage_month)
        DO UPDATE SET
            success_count = organization_usage_monthly.success_count + :success_inc,
            error_count = organization_usage_monthly.error_count + :error_inc
    """)

    db.execute(query, {
        "organization_id": organization_id,
        "usage_month": usage_month,
        "success_inc": success_inc,
        "error_inc": error_inc,
    })
    db.commit()


def get_organization_monthly_usage(db: Session, organization_id: int) -> int:
    """
    Retorna o total de chamadas (sucesso + erro) da organização no mês corrente (America/Sao_Paulo).
    """
    usage_month = get_current_month_start_sao_paulo()
    query = text("""
        SELECT COALESCE(success_count + error_count, 0) AS total
        FROM organization_usage_monthly
        WHERE organization_id = :org_id
          AND usage_month = :usage_month
    """)
    total = db.execute(query, {"org_id": organization_id, "usage_month": usage_month}).scalar()
    return int(total or 0)