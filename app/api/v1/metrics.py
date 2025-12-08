"""
Endpoints de métricas de uso de API keys.
=========================================
Expõe dados de uso para o dashboard, protegido por JWT.
"""

from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import Organization, ApiKey
from app.api.deps import get_current_organization_from_user
from app.core.usage import get_today_sao_paulo
from app.schemas.metrics import (
    UsageSummaryResponse,
    DailySeriesResponse,
    ApiKeyUsageSummary,
    DailyUsage,
    ApiKeyDailySeriesResponse,
)


router = APIRouter(prefix="/v1/metrics", tags=["Métricas"])


@router.get(
    "/summary",
    response_model=UsageSummaryResponse,
    summary="Resumo de uso",
    description="Retorna um resumo agregado do uso de todas as API keys da organização.",
    responses={
        200: {"description": "Resumo de uso retornado com sucesso"},
        401: {"description": "Não autenticado"},
    }
)
def get_usage_summary(
    days: int = Query(default=7, ge=1, le=365, description="Número de dias para o período (ex: 7, 30)"),
    org: Organization = Depends(get_current_organization_from_user),
    db: Session = Depends(get_db),
):
    """
    Retorna resumo de uso agregado dos últimos N dias.
    
    - **days**: Número de dias do período (padrão: 7)
    """
    today = get_today_sao_paulo()
    start_date = today - timedelta(days=days - 1)
    
    # Query para totais agregados por API key
    query = text("""
        SELECT 
            ak.id as api_key_id,
            ak.name as api_key_name,
            COALESCE(SUM(u.success_count), 0) as total_success,
            COALESCE(SUM(u.error_count), 0) as total_error
        FROM api_keys ak
        LEFT JOIN api_key_usage_daily u 
            ON ak.id = u.api_key_id 
            AND u.usage_date BETWEEN :start_date AND :end_date
        WHERE ak.organization_id = :org_id
        GROUP BY ak.id, ak.name
        ORDER BY ak.id
    """)
    
    rows = db.execute(query, {
        "org_id": org.id,
        "start_date": start_date,
        "end_date": today,
    }).fetchall()
    
    by_api_key = []
    total_success = 0
    total_error = 0
    
    for row in rows:
        success = int(row.total_success)
        error = int(row.total_error)
        total_success += success
        total_error += error
        
        by_api_key.append(ApiKeyUsageSummary(
            api_key_id=row.api_key_id,
            api_key_name=row.api_key_name,
            total_success=success,
            total_error=error,
            total_calls=success + error,
        ))
    
    return UsageSummaryResponse(
        period_days=days,
        start_date=start_date,
        end_date=today,
        total_success=total_success,
        total_error=total_error,
        total_calls=total_success + total_error,
        by_api_key=by_api_key,
    )


@router.get(
    "/daily",
    response_model=DailySeriesResponse,
    summary="Série diária de uso",
    description="Retorna uso diário agregado de todas as API keys da organização.",
    responses={
        200: {"description": "Série diária retornada com sucesso"},
        401: {"description": "Não autenticado"},
    }
)
def get_daily_series(
    start_date: Optional[date] = Query(default=None, description="Data inicial (default: 30 dias atrás)"),
    end_date: Optional[date] = Query(default=None, description="Data final (default: hoje)"),
    org: Organization = Depends(get_current_organization_from_user),
    db: Session = Depends(get_db),
):
    """
    Retorna série diária de uso agregado.
    
    - **start_date**: Data inicial (padrão: 30 dias atrás)
    - **end_date**: Data final (padrão: hoje)
    """
    today = get_today_sao_paulo()
    
    if end_date is None:
        end_date = today
    if start_date is None:
        start_date = end_date - timedelta(days=29)
    
    # Query para totais por dia
    query = text("""
        SELECT 
            u.usage_date,
            SUM(u.success_count) as total_success,
            SUM(u.error_count) as total_error
        FROM api_key_usage_daily u
        JOIN api_keys ak ON u.api_key_id = ak.id
        WHERE ak.organization_id = :org_id
          AND u.usage_date BETWEEN :start_date AND :end_date
        GROUP BY u.usage_date
        ORDER BY u.usage_date
    """)
    
    rows = db.execute(query, {
        "org_id": org.id,
        "start_date": start_date,
        "end_date": end_date,
    }).fetchall()
    
    # Criar mapa de dados por data
    data_map = {row.usage_date: row for row in rows}
    
    # Gerar série completa (incluindo dias sem uso)
    series = []
    current = start_date
    while current <= end_date:
        if current in data_map:
            row = data_map[current]
            success = int(row.total_success)
            error = int(row.total_error)
        else:
            success = 0
            error = 0
        
        series.append(DailyUsage(
            date=current,
            success_count=success,
            error_count=error,
            total_count=success + error,
        ))
        current += timedelta(days=1)
    
    return DailySeriesResponse(
        start_date=start_date,
        end_date=end_date,
        total_days=len(series),
        series=series,
    )


@router.get(
    "/api-keys/{api_key_id}",
    response_model=ApiKeyDailySeriesResponse,
    summary="Série diária de uma API key",
    description="Retorna uso diário de uma API key específica da organização.",
    responses={
        200: {"description": "Série diária retornada com sucesso"},
        401: {"description": "Não autenticado"},
        404: {"description": "API key não encontrada"},
    }
)
def get_api_key_daily_series(
    api_key_id: int,
    start_date: Optional[date] = Query(default=None, description="Data inicial (default: 30 dias atrás)"),
    end_date: Optional[date] = Query(default=None, description="Data final (default: hoje)"),
    org: Organization = Depends(get_current_organization_from_user),
    db: Session = Depends(get_db),
):
    """
    Retorna série diária de uso de uma API key específica.
    
    - **api_key_id**: ID da API key
    - **start_date**: Data inicial (padrão: 30 dias atrás)
    - **end_date**: Data final (padrão: hoje)
    """
    from fastapi import HTTPException, status
    
    today = get_today_sao_paulo()
    
    if end_date is None:
        end_date = today
    if start_date is None:
        start_date = end_date - timedelta(days=29)
    
    # Verificar se a API key pertence à organização
    api_key = (
        db.query(ApiKey)
        .filter(ApiKey.id == api_key_id, ApiKey.organization_id == org.id)
        .first()
    )
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key não encontrada"
        )
    
    # Query para dados diários da API key
    query = text("""
        SELECT 
            usage_date,
            success_count,
            error_count
        FROM api_key_usage_daily
        WHERE api_key_id = :api_key_id
          AND usage_date BETWEEN :start_date AND :end_date
        ORDER BY usage_date
    """)
    
    rows = db.execute(query, {
        "api_key_id": api_key_id,
        "start_date": start_date,
        "end_date": end_date,
    }).fetchall()
    
    # Criar mapa de dados por data
    data_map = {row.usage_date: row for row in rows}
    
    # Gerar série completa
    series = []
    total_success = 0
    total_error = 0
    current = start_date
    
    while current <= end_date:
        if current in data_map:
            row = data_map[current]
            success = int(row.success_count)
            error = int(row.error_count)
        else:
            success = 0
            error = 0
        
        total_success += success
        total_error += error
        
        series.append(DailyUsage(
            date=current,
            success_count=success,
            error_count=error,
            total_count=success + error,
        ))
        current += timedelta(days=1)
    
    return ApiKeyDailySeriesResponse(
        api_key_id=api_key_id,
        api_key_name=api_key.name,
        start_date=start_date,
        end_date=end_date,
        total_days=len(series),
        total_success=total_success,
        total_error=total_error,
        series=series,
    )
