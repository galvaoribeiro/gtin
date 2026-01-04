"""
Endpoints de consulta de GTIN.
==============================
Implementa GET /v1/gtins/{gtin} e POST /v1/gtins:batch
Protegidos por autenticação via API key.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Response, Query, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import Organization
from app.api.deps import get_api_key_auth, ApiKeyAuth
from app.core.usage import (
    record_api_usage,
    get_organization_daily_usage,
    get_organization_monthly_usage,
    record_org_usage_monthly,
)
from app.schemas.product import (
    ProductResponse,
    BatchRequest,
    BatchResponse,
    BatchResponseItem,
)

router = APIRouter(prefix="/v1/gtins", tags=["GTINs"])


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
            owner_tax_id,
            origin_country,
            ncm,
            cest,
            gross_weight_value,
            gross_weight_unit,
            dsit_date,
            updated_at,
            image_url
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
        "owner_tax_id": result.owner_tax_id,
        "origin_country": result.origin_country,
        "ncm": result.ncm,
        "cest": result.cest,
        "gross_weight_value": result.gross_weight_value,
        "gross_weight_unit": result.gross_weight_unit,
        "dsit_date": result.dsit_date,
        "updated_at": result.updated_at,
        "image_url": result.image_url,
    }


def process_batch_gtins(
    db: Session,
    gtins: list[str],
    auth: ApiKeyAuth,
) -> BatchResponse:
    """
    Processa uma lista de GTINs e retorna a resposta em lote.
    Função auxiliar compartilhada pelos endpoints POST e GET.
    
    Args:
        db: Sessão do banco de dados
        gtins: Lista de GTINs para consultar
        auth: Informações de autenticação
    
    Returns:
        BatchResponse com os resultados
    """
    results: list[BatchResponseItem] = []
    total_found = 0
    total_requested = len(gtins)

    # Limite "hard" defensivo para abuso
    if total_requested > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Máximo de 100 GTINs por requisição."
        )

    org = auth.organization
    is_basic_plan = org.plan == "basic"

    # Limite por plano (cada requisição batch conta como 1)
    batch_limit = org.batch_limit
    if batch_limit <= 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seu plano não permite consultas em batch. Atualize seu plano para habilitar."
        )
    if total_requested > batch_limit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Limite do plano excedido: máximo de {batch_limit} GTINs por batch."
        )

    # Enforce limites: diário para basic, mensal para demais
    if is_basic_plan:
        used_today = get_organization_daily_usage(db, org.id)
        if used_today + 1 > org.daily_limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Limite diário excedido. Restam {max(org.daily_limit - used_today, 0)} de {org.daily_limit} chamadas para hoje.",
            )
    else:
        monthly_limit = org.monthly_limit
        used_month = get_organization_monthly_usage(db, org.id)
        if monthly_limit > 0 and used_month + 1 > monthly_limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Limite mensal excedido. Restam {max(monthly_limit - used_month, 0)} de {monthly_limit} chamadas para este mês.",
            )

    # Normalizar todos os GTINs e criar mapeamento
    normalized_gtins_map = {}  # Mapeia GTIN original -> GTIN normalizado
    valid_normalized_gtins = []  # Lista de GTINs normalizados válidos para query
    
    for original_gtin in gtins:
        normalized = normalize_gtin(original_gtin)
        normalized_gtins_map[original_gtin] = normalized
        if normalized:  # Apenas adicionar à query se não estiver vazio
            valid_normalized_gtins.append(normalized)
    
    # Buscar todos os produtos de uma vez (mais eficiente)
    found_products = {}
    if valid_normalized_gtins:
        # Criar query com IN clause
        placeholders = ", ".join([f":gtin_{i}" for i in range(len(valid_normalized_gtins))])
        query = text(f"""
            SELECT 
                gtin,
                gtin_type,
                brand,
                product_name,
                owner_tax_id,
                origin_country,
                ncm,
                cest,
                gross_weight_value,
                gross_weight_unit,
                dsit_date,
                updated_at,
                image_url
            FROM products
            WHERE gtin IN ({placeholders})
        """)
        
        # Criar parâmetros
        params = {f"gtin_{i}": g for i, g in enumerate(valid_normalized_gtins)}
        
        # Executar query
        rows = db.execute(query, params).fetchall()
        
        # Criar mapa de resultados encontrados
        for row in rows:
            found_products[row.gtin] = {
                "gtin": row.gtin,
                "gtin_type": row.gtin_type,
                "brand": row.brand,
                "product_name": row.product_name,
                "owner_tax_id": row.owner_tax_id,
                "origin_country": row.origin_country,
                "ncm": row.ncm,
                "cest": row.cest,
                "gross_weight_value": row.gross_weight_value,
                "gross_weight_unit": row.gross_weight_unit,
                "dsit_date": row.dsit_date,
                "updated_at": row.updated_at,
                "image_url": row.image_url,
            }
    
    # Montar resposta mantendo a ordem dos GTINs solicitados
    for original_gtin in gtins:
        normalized_gtin = normalized_gtins_map[original_gtin]
        
        if not normalized_gtin:
            # GTIN inválido (vazio após normalização)
            results.append(BatchResponseItem(
                gtin=original_gtin,
                found=False,
                product=None
            ))
        elif normalized_gtin in found_products:
            # Produto encontrado
            results.append(BatchResponseItem(
                gtin=original_gtin,
                found=True,
                product=ProductResponse(**found_products[normalized_gtin])
            ))
            total_found += 1
        else:
            # GTIN válido mas produto não encontrado
            results.append(BatchResponseItem(
                gtin=original_gtin,
                found=False,
                product=None
            ))
    
    # Registrar uso: cada requisição batch conta como 1 consulta (independente do número de GTINs)
    if total_requested > 0:
        if is_basic_plan:
            record_api_usage(db, auth.api_key.id, 200)
        else:
            record_org_usage_monthly(db, org.id, 200)
            # Mantemos também o registro por API key para métricas
            record_api_usage(db, auth.api_key.id, 200)
    
    return BatchResponse(
        total_requested=total_requested,
        total_found=total_found,
        results=results
    )


@router.post(
    "/batch",
    response_model=BatchResponse,
    summary="Consultar produtos em lote (POST)",
    description="Consulta múltiplos produtos de uma vez. Limites por plano: starter=2, pro=5, advanced=10 (basic não permite batch). Máximo absoluto de 100 GTINs por requisição. Requer API key válida.",
    responses={
        200: {"description": "Resultados da consulta em lote"},
        400: {"description": "Requisição inválida"},
        401: {"description": "API key inválida ou não fornecida"},
        403: {"description": "Plano não permite batch"},
        429: {"description": "Limite diário excedido"},
    }
)
def get_products_batch(
    batch_request: BatchRequest,
    request: Request,
    auth: ApiKeyAuth = Depends(get_api_key_auth),
    db: Session = Depends(get_db),
):
    """
    Consulta múltiplos produtos por GTIN via POST.
    
    - **gtins**: Lista de códigos de barras (máximo 100)
    
    Retorna todos os GTINs solicitados, indicando quais foram encontrados.
    """
    return process_batch_gtins(db, batch_request.gtins, auth)


@router.get(
    "/batch",
    response_model=BatchResponse,
    summary="Consultar produtos em lote (GET)",
    description="Consulta múltiplos produtos de uma vez via query parameters. Limites por plano: starter=2, pro=5, advanced=10 (basic não permite batch). Máximo absoluto de 100 GTINs por requisição. Ideal para cacheamento. Requer API key válida.",
    responses={
        200: {"description": "Resultados da consulta em lote"},
        400: {"description": "Requisição inválida"},
        401: {"description": "API key inválida ou não fornecida"},
        403: {"description": "Plano não permite batch"},
        429: {"description": "Limite diário excedido"},
    }
)
def get_products_batch_query(
    response: Response,
    gtins: list[str] = Query(
        ...,
        description="Lista de GTINs para consultar (limite depende do plano; hard limit 100)",
        min_length=1,
        alias="gtin"
    ),
    request: Request = None,
    auth: ApiKeyAuth = Depends(get_api_key_auth),
    db: Session = Depends(get_db),
):
    """
    Consulta múltiplos produtos por GTIN via GET.
    
    - **gtin**: Parâmetro repetido para cada GTIN (ex: ?gtin=123&gtin=456)
    - Máximo de 10 GTINs por requisição
    
    Este endpoint é cacheável e ideal para consultas repetidas.
    Use `Cache-Control` para configurar o cache conforme necessário.
    
    Retorna todos os GTINs solicitados, indicando quais foram encontrados.
    """
    # Validar quantidade de GTINs
    if len(gtins) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Máximo de 10 GTINs permitidos por requisição GET. Use POST /v1/gtins/batch para lotes maiores."
        )
    
    if len(gtins) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pelo menos um GTIN deve ser fornecido"
        )
    
    # Processar batch
    batch_response = process_batch_gtins(db, gtins, auth)
    
    # Adicionar headers de cache
    # Cache por 1 hora (3600 segundos) - ajuste conforme necessário
    # Varia por X-API-Key para separar cache por organização
    response.headers["Cache-Control"] = "private, max-age=3600"
    response.headers["Vary"] = "X-API-Key"
    
    return batch_response


@router.get(
    "/{gtin}",
    response_model=ProductResponse,
    summary="Consultar produto por GTIN",
    description="Retorna os dados de um produto a partir do seu código GTIN (código de barras). Requer API key válida.",
    responses={
        200: {"description": "Produto encontrado"},
        401: {"description": "API key inválida ou não fornecida"},
        404: {"description": "Produto não encontrado"},
    }
)
def get_product_by_gtin(
    gtin: str,
    request: Request,
    auth: ApiKeyAuth = Depends(get_api_key_auth),
    db: Session = Depends(get_db),
):
    """
    Consulta um produto pelo GTIN.
    
    - **gtin**: Código de barras do produto (8, 12, 13 ou 14 dígitos)
    """
    # Normalizar GTIN (remover caracteres não numéricos)
    normalized_gtin = normalize_gtin(gtin)
    
    org = auth.organization
    is_basic_plan = org.plan == "basic"

    # Enforce limites: diário para basic, mensal para demais
    if is_basic_plan:
        used_today = get_organization_daily_usage(db, org.id)
        if used_today + 1 > org.daily_limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Limite diário excedido. Restam {max(org.daily_limit - used_today, 0)} de {org.daily_limit} chamadas para hoje.",
            )
    else:
        monthly_limit = org.monthly_limit
        used_month = get_organization_monthly_usage(db, org.id)
        if monthly_limit > 0 and used_month + 1 > monthly_limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Limite mensal excedido. Restam {max(monthly_limit - used_month, 0)} de {monthly_limit} chamadas para este mês.",
            )
    
    if not normalized_gtin:
        # Registrar erro e lançar exceção
        if is_basic_plan:
            record_api_usage(db, auth.api_key.id, 400)
        else:
            record_org_usage_monthly(db, org.id, 400)
            record_api_usage(db, auth.api_key.id, 400)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GTIN inválido: deve conter apenas números"
        )
    
    product = fetch_product_by_gtin(db, normalized_gtin)
    
    if product is None:
        # Registrar erro 404
        if is_basic_plan:
            record_api_usage(db, auth.api_key.id, 404)
        else:
            record_org_usage_monthly(db, org.id, 404)
            record_api_usage(db, auth.api_key.id, 404)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produto com GTIN '{normalized_gtin}' não encontrado"
        )
    
    # Registrar sucesso
    if is_basic_plan:
        record_api_usage(db, auth.api_key.id, 200)
    else:
        record_org_usage_monthly(db, org.id, 200)
        record_api_usage(db, auth.api_key.id, 200)
    return product

