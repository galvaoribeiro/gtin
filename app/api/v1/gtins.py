"""
Endpoints de consulta de GTIN.
==============================
Implementa GET /v1/gtins/{gtin} e POST /v1/gtins:batch
Protegidos por autenticação via API key.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import Organization
from app.api.deps import get_api_key_auth, ApiKeyAuth
from app.core.usage import record_api_usage, record_api_usage_batch
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
    
    if not normalized_gtin:
        # Registrar erro e lançar exceção
        record_api_usage(db, auth.api_key.id, 400)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GTIN inválido: deve conter apenas números"
        )
    
    product = fetch_product_by_gtin(db, normalized_gtin)
    
    if product is None:
        # Registrar erro 404
        record_api_usage(db, auth.api_key.id, 404)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produto com GTIN '{normalized_gtin}' não encontrado"
        )
    
    # Registrar sucesso
    record_api_usage(db, auth.api_key.id, 200)
    return product


@router.post(
    ":batch",
    response_model=BatchResponse,
    summary="Consultar produtos em lote",
    description="Consulta múltiplos produtos de uma vez. Máximo de 100 GTINs por requisição. Requer API key válida.",
    responses={
        200: {"description": "Resultados da consulta em lote"},
        400: {"description": "Requisição inválida"},
        401: {"description": "API key inválida ou não fornecida"},
    }
)
def get_products_batch(
    batch_request: BatchRequest,
    request: Request,
    auth: ApiKeyAuth = Depends(get_api_key_auth),
    db: Session = Depends(get_db),
):
    """
    Consulta múltiplos produtos por GTIN.
    
    - **gtins**: Lista de códigos de barras (máximo 100)
    
    Retorna todos os GTINs solicitados, indicando quais foram encontrados.
    """
    results: list[BatchResponseItem] = []
    total_found = 0
    
    # Normalizar todos os GTINs
    normalized_gtins = [normalize_gtin(g) for g in batch_request.gtins]
    
    # Buscar todos os produtos de uma vez (mais eficiente)
    if normalized_gtins:
        # Criar query com IN clause
        placeholders = ", ".join([f":gtin_{i}" for i in range(len(normalized_gtins))])
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
        params = {f"gtin_{i}": g for i, g in enumerate(normalized_gtins)}
        
        # Executar query
        rows = db.execute(query, params).fetchall()
        
        # Criar mapa de resultados encontrados
        found_products = {}
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
        for original_gtin, normalized_gtin in zip(batch_request.gtins, normalized_gtins):
            if normalized_gtin in found_products:
                results.append(BatchResponseItem(
                    gtin=original_gtin,
                    found=True,
                    product=ProductResponse(**found_products[normalized_gtin])
                ))
                total_found += 1
            else:
                results.append(BatchResponseItem(
                    gtin=original_gtin,
                    found=False,
                    product=None
                ))
    
    total_requested = len(batch_request.gtins)
    
    # Registrar uso proporcional ao total solicitado:
    # - GTINs encontrados contam como sucesso
    # - GTINs não encontrados contam como erro
    if total_requested > 0:
        record_api_usage_batch(
            db,
            auth.api_key.id,
            success_count=total_found,
            error_count=total_requested - total_found,
        )
    
    return BatchResponse(
        total_requested=total_requested,
        total_found=total_found,
        results=results
    )

