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
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    subscription_status: Optional[str] = None
    current_period_end: Optional[datetime] = None
    default_payment_method: Optional[str] = None

    class Config:
        from_attributes = True


class AdminOrganizationsPage(BaseModel):
    items: list[AdminOrganizationItem]
    page: int
    per_page: int
    total: int


class AdminOrganizationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    plan: Optional[str] = Field(None, description="basic, starter, pro, advanced")
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    subscription_status: Optional[str] = None
    current_period_end: Optional[datetime] = None
    default_payment_method: Optional[str] = None
