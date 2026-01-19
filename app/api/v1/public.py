"""
Endpoints públicos (sem autenticação).
======================================
Permite consultas gratuitas de GTIN sem API key.
Inclui rate limit por IP para proteção.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.product import ProductResponse
from app.core.rate_limit import check_public_rate_limit


router = APIRouter(prefix="/v1/public", tags=["Public"])


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
    "/gtins/{gtin}",
    response_model=ProductResponse,
    summary="Consultar produto por GTIN (Público)",
    description="Retorna os dados de um produto a partir do seu código GTIN (código de barras). "
                "Endpoint público sem necessidade de autenticação. "
                "Rate limit: 20 requisições por dia por IP + cooldown entre chamadas.",
    responses={
        200: {"description": "Produto encontrado"},
        400: {"description": "GTIN inválido"},
        404: {"description": "Produto não encontrado"},
        429: {"description": "Rate limit excedido"},
    }
)
def get_product_by_gtin_public(
    gtin: str,
    request: Request,
    db: Session = Depends(get_db),
    client_ip: str = Depends(check_public_rate_limit),
):
    """
    Consulta pública de produto por GTIN.
    
    Este endpoint não requer autenticação e não consome quota de API.
    Ideal para testes e consultas ocasionais na landing page.
    
    - **gtin**: Código de barras do produto (8, 12, 13 ou 14 dígitos)
    
    Limitações:
    - 20 requisições por dia por IP (reset 00:00 America/Sao_Paulo)
    - Cooldown: 1 requisição a cada 5 segundos por IP
    - Não registra métricas de uso
    """
    # Normalizar GTIN (remover caracteres não numéricos)
    normalized_gtin = normalize_gtin(gtin)
    
    if not normalized_gtin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GTIN inválido: deve conter apenas números"
        )
    
    # Buscar produto
    product = fetch_product_by_gtin(db, normalized_gtin)
    
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produto com GTIN '{normalized_gtin}' não encontrado"
        )
    
    # Retornar produto sem registrar uso
    return product


