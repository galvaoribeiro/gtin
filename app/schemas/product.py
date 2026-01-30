"""
Schemas Pydantic para produtos GTIN.
====================================
Define os modelos de entrada e saída da API.
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class ProductResponse(BaseModel):
    """Schema de resposta para um produto."""
    
    gtin: str = Field(..., description="Código GTIN (código de barras)")
    gtin_type: Optional[int] = Field(None, description="Tipo do GTIN (8, 12, 13 ou 14 dígitos)")
    brand: Optional[str] = Field(None, description="Marca do produto")
    product_name: Optional[str] = Field(None, description="Nome/descrição do produto")
    origin_country: Optional[str] = Field(None, description="País de origem")
    ncm: Optional[str] = Field(None, description="Código NCM (8 dígitos)")
    cest: Optional[list[str]] = Field(None, description="Lista de códigos CEST")
    gross_weight_value: Optional[Decimal] = Field(None, description="Peso bruto")
    gross_weight_unit: Optional[str] = Field(None, description="Unidade do peso bruto")

    class Config:
        from_attributes = True  # Permite criar a partir de objetos ORM/Row


class ProductNotFound(BaseModel):
    """Schema para quando um produto não é encontrado."""
    
    gtin: str = Field(..., description="GTIN consultado")
    found: bool = Field(default=False, description="Indica se foi encontrado")
    message: str = Field(default="Produto não encontrado", description="Mensagem de erro")


class BatchRequest(BaseModel):
    """Schema de requisição para consulta em lote."""
    
    gtins: list[str] = Field(
        ..., 
        description="Lista de GTINs para consultar",
        min_items=1,
        max_items=100  # Limite de 100 GTINs por requisição
    )


class BatchResponseItem(BaseModel):
    """Item da resposta de consulta em lote."""
    
    gtin: str = Field(..., description="GTIN consultado")
    found: bool = Field(..., description="Indica se o produto foi encontrado")
    product: Optional[ProductResponse] = Field(None, description="Dados do produto, se encontrado")


class BatchResponse(BaseModel):
    """Schema de resposta para consulta em lote."""
    
    total_requested: int = Field(..., description="Total de GTINs solicitados")
    total_found: int = Field(..., description="Total de produtos encontrados")
    results: list[BatchResponseItem] = Field(..., description="Lista de resultados")


class SearchResponse(BaseModel):
    """Resposta paginada para busca de produtos por filtros."""

    total: int = Field(..., description="Total de registros que atendem aos filtros")
    offset: int = Field(..., description="Offset atual da paginação")
    limit: int = Field(..., description="Limite de itens por página (fixo em 10)")
    returned: int = Field(..., description="Quantidade de itens retornados nesta página")
    items: list[ProductResponse] = Field(..., description="Itens da página")
