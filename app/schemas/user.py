"""
Schemas Pydantic para Users e Autenticação.
============================================
Define os modelos de entrada e saída para login e usuários.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, EmailStr


# =============================================================================
# User Schemas
# =============================================================================

class UserBase(BaseModel):
    """Schema base para User."""
    email: EmailStr = Field(..., description="Email do usuário")


class UserCreate(UserBase):
    """Schema para criar um usuário."""
    password: str = Field(..., min_length=8, description="Senha (mínimo 8 caracteres)")
    organization_id: int = Field(..., description="ID da organização")


class UserRegister(UserBase):
    """Schema para registro público de usuário (cria org automaticamente)."""
    password: str = Field(..., min_length=8, description="Senha (mínimo 8 caracteres)")
    organization_name: str = Field(..., min_length=2, max_length=255, description="Nome da organização")


class UserUpdate(BaseModel):
    """Schema para atualizar dados do usuário e organização."""
    email: Optional[EmailStr] = Field(None, description="Novo email do usuário")
    organization_name: Optional[str] = Field(None, min_length=2, max_length=255, description="Novo nome da organização")


class UserResponse(UserBase):
    """Schema de resposta para User."""
    id: int = Field(..., description="ID do usuário")
    organization_id: int = Field(..., description="ID da organização")
    organization_name: Optional[str] = Field(None, description="Nome da organização")
    plan: Optional[str] = Field(None, description="Plano atual: basic, starter, pro, advanced")
    daily_limit: Optional[int] = Field(None, description="Limite de consultas por dia")
    is_active: bool = Field(..., description="Se o usuário está ativo")
    created_at: datetime = Field(..., description="Data de criação")
    
    class Config:
        from_attributes = True


# =============================================================================
# Auth Schemas
# =============================================================================

class UserLogin(BaseModel):
    """Schema para login."""
    email: EmailStr = Field(..., description="Email do usuário")
    password: str = Field(..., description="Senha")


class Token(BaseModel):
    """Schema de resposta do token JWT."""
    access_token: str = Field(..., description="Token JWT de acesso")
    token_type: str = Field(default="bearer", description="Tipo do token")


class TokenData(BaseModel):
    """Schema com dados extraídos do token."""
    user_id: Optional[int] = None
    email: Optional[str] = None

