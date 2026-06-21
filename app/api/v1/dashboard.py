"""
Endpoints de dashboard protegidos por JWT.
==========================================
Inclui consulta de GTIN para o painel administrativo.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import User, ApiKey
from app.api.deps import get_current_user
from app.schemas.product import (
    ProductResponse,
    BatchRequest,
    BatchResponse,
    BatchResponseItem,
)
from app.core.usage import (
    record_api_usage,
    record_api_usage_batch,
    get_organization_monthly_usage,
    record_org_usage_monthly,
    record_org_usage_monthly_batch,
)


router = APIRouter(prefix="/v1/dashboard", tags=["Dashboard"])


def normalize_gtin(gtin: str) -> str:
    """Remove caracteres não numéricos do GTIN."""
    return "".join(c for c in gtin if c.isdigit())


def fetch_product_by_gtin(db: Session, gtin: str) -> dict | None:
    """
    Busca um produto pelo GTIN no banco de dados.
    
    Returns:
        Dict com os dados do produto ou None se não encontrado.
    """
    query = text("""
        SELECT 
            gtin,
            gtin_type,
            brand,
            product_name,
            origin_country,
            ncm,
            cest,
            gross_weight_value,
            gross_weight_unit
        FROM products
        WHERE gtin = :gtin
    """)
    
    result = db.execute(query, {"gtin": gtin}).fetchone()
    
    if result is None:
        return None
    
    # Converter Row para dict
    return {
        "gtin": result.gtin,
        "gtin_type": result.gtin_type,
        "brand": result.brand,
        "product_name": result.product_name,
        "origin_country": result.origin_country,
        "ncm": result.ncm,
        "cest": result.cest,
        "gross_weight_value": result.gross_weight_value,
        "gross_weight_unit": result.gross_weight_unit,
    }


def get_user_api_key(db: Session, organization_id: int) -> ApiKey | None:
    """
    Retorna a primeira API key ativa da organização para registro de uso.
    """
    return (
        db.query(ApiKey)
        .filter(ApiKey.organization_id == organization_id, ApiKey.is_active == True)
        .first()
    )


@router.get(
    "/gtins/{gtin}",
    response_model=ProductResponse,
    summary="Consultar produto por GTIN (Dashboard)",
    description="Retorna os dados de um produto a partir do seu código GTIN. Requer autenticação JWT.",
    responses={
        200: {"description": "Produto encontrado"},
        401: {"description": "Não autenticado"},
        404: {"description": "Produto não encontrado"},
    }
)
def get_product_by_gtin_dashboard(
    gtin: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Consulta um produto pelo GTIN (endpoint de dashboard).
    
    Requer autenticação JWT (não usa API key).
    Registra uso na primeira API key ativa da organização.
    
    - **gtin**: Código de barras do produto (8, 12, 13 ou 14 dígitos)
    """
    # Normalizar GTIN (remover caracteres não numéricos)
    normalized_gtin = normalize_gtin(gtin)
    
    # Obter API key da organização para registro de uso
    api_key = get_user_api_key(db, current_user.organization_id)
    
    # Bloquear uso se não houver API key ativa para garantir contagem
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nenhuma chave de acesso ativa para esta organização. Crie ou reative uma chave de acesso para fazer a consulta.",
        )
    
    org = current_user.organization

    monthly_limit = org.monthly_limit
    used_month = get_organization_monthly_usage(db, org.id)
    if monthly_limit > 0 and used_month + 1 > monthly_limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Limite mensal excedido. Restam {max(monthly_limit - used_month, 0)} de {monthly_limit} chamadas para este mês.",
        )
    
    if not normalized_gtin:
        record_org_usage_monthly(db, org.id, 400)
        record_api_usage(db, api_key.id, 400)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GTIN inválido: deve conter apenas números"
        )
    
    product = fetch_product_by_gtin(db, normalized_gtin)
    
    if product is None:
        record_org_usage_monthly(db, org.id, 404)
        record_api_usage(db, api_key.id, 404)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produto com GTIN '{normalized_gtin}' não encontrado"
        )
    
    # Registrar sucesso
    if api_key:
        record_org_usage_monthly(db, org.id, 200)
        record_api_usage(db, api_key.id, 200)
        db.commit()
    
    return product


DASHBOARD_BATCH_LIMIT = 50


@router.post(
    "/gtins/batch",
    response_model=BatchResponse,
    summary="Consultar produtos em lote (Dashboard)",
    description=(
        "Consulta até 50 GTINs de uma vez via dashboard. "
        "Apenas GTINs encontrados consomem cota mensal. "
        "Requer autenticação JWT."
    ),
    responses={
        200: {"description": "Resultados da consulta em lote"},
        400: {"description": "Requisição inválida"},
        401: {"description": "Não autenticado"},
        403: {"description": "Sem API key ativa"},
        429: {"description": "Limite mensal excedido"},
    }
)
def get_products_batch_dashboard(
    batch_request: BatchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Consulta múltiplos produtos por GTIN via dashboard (JWT).

    - Máximo de 50 GTINs por requisição.
    - Apenas GTINs encontrados consomem a cota mensal da organização.
    - GTINs não encontrados aparecem como found=false sem consumir cota.
    """
    gtins = batch_request.gtins

    if len(gtins) > DASHBOARD_BATCH_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Máximo de {DASHBOARD_BATCH_LIMIT} GTINs por requisição.",
        )

    if len(gtins) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pelo menos um GTIN deve ser fornecido.",
        )

    api_key = get_user_api_key(db, current_user.organization_id)
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nenhuma chave de acesso ativa para esta organização. Crie ou reative uma chave de acesso para fazer a consulta.",
        )

    org = current_user.organization

    # Normalizar GTINs
    normalized_map: dict[str, str] = {}
    valid_normalized: list[str] = []
    for original in gtins:
        normalized = normalize_gtin(original)
        normalized_map[original] = normalized
        if normalized:
            valid_normalized.append(normalized)

    # Buscar todos os produtos em uma query
    found_products: dict[str, dict] = {}
    if valid_normalized:
        placeholders = ", ".join([f":gtin_{i}" for i in range(len(valid_normalized))])
        query = text(f"""
            SELECT
                gtin, gtin_type, brand, product_name,
                origin_country, ncm, cest,
                gross_weight_value, gross_weight_unit
            FROM products
            WHERE gtin IN ({placeholders})
        """)
        params = {f"gtin_{i}": g for i, g in enumerate(valid_normalized)}
        rows = db.execute(query, params).fetchall()
        for row in rows:
            found_products[row.gtin] = {
                "gtin": row.gtin,
                "gtin_type": row.gtin_type,
                "brand": row.brand,
                "product_name": row.product_name,
                "origin_country": row.origin_country,
                "ncm": row.ncm,
                "cest": row.cest,
                "gross_weight_value": row.gross_weight_value,
                "gross_weight_unit": row.gross_weight_unit,
            }

    # Contar encontrados
    total_found = 0
    for original in gtins:
        normalized = normalized_map[original]
        if normalized and normalized in found_products:
            total_found += 1

    # Verificar cota mensal (apenas encontrados consomem)
    monthly_limit = org.monthly_limit
    used_month = get_organization_monthly_usage(db, org.id)
    if monthly_limit > 0 and total_found > 0 and used_month + total_found > monthly_limit:
        remaining = max(monthly_limit - used_month, 0)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Limite mensal excedido. Este lote contém {total_found} GTINs encontrados, mas restam apenas {remaining} de {monthly_limit} consultas para este mês.",
        )

    # Montar resposta mantendo a ordem original
    results: list[BatchResponseItem] = []
    for original in gtins:
        normalized = normalized_map[original]
        if not normalized:
            results.append(BatchResponseItem(gtin=original, found=False, product=None))
        elif normalized in found_products:
            results.append(BatchResponseItem(
                gtin=original,
                found=True,
                product=ProductResponse(**found_products[normalized]),
            ))
        else:
            results.append(BatchResponseItem(gtin=original, found=False, product=None))

    # Registrar uso: apenas encontrados consomem cota mensal
    total_not_found = len(gtins) - total_found
    if total_found > 0:
        record_org_usage_monthly_batch(db, org.id, success_count=total_found, error_count=0)
    if total_not_found > 0:
        record_org_usage_monthly_batch(db, org.id, success_count=0, error_count=total_not_found)
    record_api_usage_batch(db, api_key.id, success_count=total_found, error_count=total_not_found)
    db.commit()

    return BatchResponse(
        total_requested=len(gtins),
        total_found=total_found,
        results=results,
    )

