"""
Schemas Pydantic para Organizations e API Keys.
===============================================
Define os modelos de entrada e saída para autenticação.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# =============================================================================
# Organization Schemas
# =============================================================================

class OrganizationBase(BaseModel):
    """Schema base para Organization."""
    name: str = Field(..., description="Nome da organização/cliente")
    plan: str = Field(default="basic", description="Plano: basic (grátis), starter, pro, enterprise")
    daily_limit: int = Field(default=15, description="Limite de consultas por dia")


class OrganizationCreate(OrganizationBase):
    """Schema para criar uma organização."""
    pass


class OrganizationResponse(OrganizationBase):
    """Schema de resposta para Organization."""
    id: int = Field(..., description="ID da organização")
    created_at: datetime = Field(..., description="Data de criação")
    
    class Config:
        from_attributes = True


# =============================================================================
# API Key Schemas
# =============================================================================

class ApiKeyBase(BaseModel):
    """Schema base para ApiKey."""
    is_active: bool = Field(default=True, description="Se a key está ativa")


class ApiKeyCreate(ApiKeyBase):
    """Schema para criar uma API key."""
    organization_id: int = Field(..., description="ID da organização")


class ApiKeyResponse(ApiKeyBase):
    """Schema de resposta para ApiKey (sem expor a key completa)."""
    id: int = Field(..., description="ID da API key")
    organization_id: int = Field(..., description="ID da organização")
    key_prefix: str = Field(..., description="Prefixo da API key (primeiros 8 chars)")
    created_at: datetime = Field(..., description="Data de criação")
    last_used_at: Optional[datetime] = Field(None, description="Última vez usada")
    
    class Config:
        from_attributes = True


class ApiKeyCreatedResponse(ApiKeyBase):
    """
    Schema de resposta ao criar uma API key.
    Inclui a key completa (só mostrada uma vez!).
    """
    id: int = Field(..., description="ID da API key")
    organization_id: int = Field(..., description="ID da organização")
    key: str = Field(..., description="API key completa (guarde em local seguro!)")
    created_at: datetime = Field(..., description="Data de criação")
    
    class Config:
        from_attributes = True

