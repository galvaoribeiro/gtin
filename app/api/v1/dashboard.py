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
from app.schemas.product import ProductResponse
from app.core.usage import record_api_usage


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
    
    if not normalized_gtin:
        if api_key:
            record_api_usage(db, api_key.id, 400)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GTIN inválido: deve conter apenas números"
        )
    
    product = fetch_product_by_gtin(db, normalized_gtin)
    
    if product is None:
        if api_key:
            record_api_usage(db, api_key.id, 404)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produto com GTIN '{normalized_gtin}' não encontrado"
        )
    
    # Registrar sucesso
    if api_key:
        record_api_usage(db, api_key.id, 200)
    
    return product

