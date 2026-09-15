"""
Schemas Pydantic para painel administrativo (staff).
"""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field, EmailStr


# =============================================================================
# Users (Admin)
# =============================================================================


class AdminUserItem(BaseModel):
    id: int
    email: EmailStr
    organization_id: int
    organization_name: Optional[str] = None
    plan: Optional[str] = None
    subscription_status: Optional[str] = None
    cancel_at_period_end: bool = False
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AdminUsersPage(BaseModel):
    items: list[AdminUserItem]
    page: int
    per_page: int
    total: int


class AdminUserUpdate(BaseModel):
    is_active: Optional[bool] = Field(None, description="Ativar/desativar usuário")
    role: Optional[str] = Field(None, description="Papel: user ou admin")
    new_password: Optional[str] = Field(None, min_length=8, description="Redefinir senha")


# =============================================================================
# Organizations (Admin)
# =============================================================================


class AdminOrganizationItem(BaseModel):
    id: int
    name: str
    plan: str
    created_at: datetime
    batch_limit_override: Optional[int] = None
    monthly_limit_override: Optional[int] = None
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    subscription_status: Optional[str] = None
    cancel_at_period_end: bool = False
    current_period_end: Optional[datetime] = None
    default_payment_method: Optional[str] = None
    enterprise_price_id: Optional[str] = None
    enterprise_amount_cents: Optional[int] = None

    class Config:
        from_attributes = True


class AdminOrganizationsPage(BaseModel):
    items: list[AdminOrganizationItem]
    page: int
    per_page: int
    total: int


class AdminOrganizationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    plan: Optional[str] = Field(None, description="basic, starter, pro, advanced, enterprise")
    batch_limit_override: Optional[int] = Field(None, ge=0, description="Override do limite de batch (null = padrão do plano)")
    monthly_limit_override: Optional[int] = Field(None, ge=0, description="Override do limite mensal (null = padrão do plano)")
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    subscription_status: Optional[str] = None
    current_period_end: Optional[datetime] = None
    default_payment_method: Optional[str] = None


class AdminEnterpriseUpgradeLinkRequest(BaseModel):
    """
    Dados necessários para gerar o link de upgrade Enterprise: o valor
    mensal negociado (obrigatório) e, opcionalmente, os limites (override)
    que devem ser aplicados automaticamente à organização no momento em que
    o cliente confirmar a migração pelo Portal de Cobrança. Deixe os limites
    em branco (null) para usar os valores padrão do plano Enterprise
    (batch: 100, mensal: 20.000).
    """

    amount_cents: int = Field(
        ..., gt=0, le=99999999,
        description="Valor mensal negociado com o cliente, em centavos (obrigatório)",
    )
    batch_limit_override: Optional[int] = Field(
        None, ge=0,
        description="Limite de GTINs por batch a aplicar quando o cliente confirmar (null = padrão do plano, 100)",
    )
    monthly_limit_override: Optional[int] = Field(
        None, ge=0,
        description="Limite mensal de chamadas a aplicar quando o cliente confirmar (null = padrão do plano, 20000)",
    )


class AdminEnterpriseUpgradeLinkResponse(BaseModel):
    """
    Link do Portal de Cobrança gerado para o cliente confirmar o upgrade
    Enterprise. A migração ainda não ocorreu neste momento: ela só é
    efetivada (e cobrada) quando o próprio cliente abre o link e confirma.
    """

    message: str = Field(..., description="Resumo da operação para exibição ao administrador")
    portal_url: str = Field(..., description="Link do Portal de Cobrança para o cliente confirmar a troca e o pagamento")
    organization_id: int = Field(..., description="ID da organização associada ao link")
    amount_cents: int = Field(..., description="Valor mensal negociado, em centavos")
    currency: str = Field(..., description="Moeda do Price Enterprise dedicado")
    price_id: str = Field(..., description="ID do Price Enterprise dedicado criado/reaproveitado no Stripe")
    batch_limit_override: Optional[int] = Field(None, description="Limite de batch que será aplicado quando o cliente confirmar")
    monthly_limit_override: Optional[int] = Field(None, description="Limite mensal que será aplicado quando o cliente confirmar")
