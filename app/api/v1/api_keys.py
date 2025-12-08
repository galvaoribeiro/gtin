"""
Endpoints de gerenciamento de API Keys para o Dashboard.
========================================================
Implementa GET, POST e revoke de API keys.
Protegido por autenticação JWT.
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import ApiKey, Organization, User
from app.api.deps import get_current_user, get_current_organization_from_user


router = APIRouter(prefix="/v1/dashboard/api-keys", tags=["Dashboard - API Keys"])


# =============================================================================
# Schemas
# =============================================================================

class ApiKeyResponse(BaseModel):
    """Schema de resposta para API Key (com key mascarada)."""
    id: int
    name: Optional[str]
    masked_key: str
    status: str  # "active" ou "revoked"
    created_at: datetime
    last_used_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class ApiKeyCreatedResponse(BaseModel):
    """Schema de resposta ao criar uma API Key (com key completa)."""
    id: int
    name: Optional[str]
    key: str  # Key completa - mostrada apenas uma vez!
    masked_key: str
    status: str
    created_at: datetime
    last_used_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class CreateApiKeyRequest(BaseModel):
    """Schema para criar uma nova API Key."""
    name: Optional[str] = Field(default="Nova chave", description="Nome/descricao da chave")


# =============================================================================
# Helper Functions
# =============================================================================

def api_key_to_response(api_key: ApiKey) -> ApiKeyResponse:
    """Converte um modelo ApiKey para o schema de resposta."""
    return ApiKeyResponse(
        id=api_key.id,
        name=api_key.name,
        masked_key=api_key.get_masked_key(),
        status="active" if api_key.is_active else "revoked",
        created_at=api_key.created_at,
        last_used_at=api_key.last_used_at,
    )


# =============================================================================
# Endpoints
# =============================================================================

@router.get(
    "",
    response_model=list[ApiKeyResponse],
    summary="Listar API Keys",
    description="Retorna todas as API keys da organização do usuário autenticado.",
)
def list_api_keys(
    org: Organization = Depends(get_current_organization_from_user),
    db: Session = Depends(get_db),
):
    """
    Lista todas as API keys da organização.
    
    Requer autenticação JWT.
    
    Returns:
        Lista de API keys com informacoes basicas (key mascarada).
    """
    api_keys = (
        db.query(ApiKey)
        .filter(ApiKey.organization_id == org.id)
        .order_by(ApiKey.created_at.desc())
        .all()
    )
    
    return [api_key_to_response(key) for key in api_keys]


@router.post(
    "",
    response_model=ApiKeyCreatedResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar nova API Key",
    description="Gera uma nova API key para a organização. A key completa só é exibida uma vez!",
)
def create_api_key(
    request: CreateApiKeyRequest = CreateApiKeyRequest(),
    org: Organization = Depends(get_current_organization_from_user),
    db: Session = Depends(get_db),
):
    """
    Cria uma nova API key.
    
    Requer autenticação JWT.
    
    IMPORTANTE: A key completa so e retornada nesta resposta!
    Guarde-a em local seguro.
    
    Returns:
        API key criada com a key completa.
    """
    # Gerar nova key
    new_key_value = ApiKey.generate_key()
    
    # Criar registro
    api_key = ApiKey(
        organization_id=org.id,
        name=request.name,
        key=new_key_value,
        is_active=True,
    )
    
    db.add(api_key)
    db.commit()
    db.refresh(api_key)
    
    return ApiKeyCreatedResponse(
        id=api_key.id,
        name=api_key.name,
        key=api_key.key,  # Key completa!
        masked_key=api_key.get_masked_key(),
        status="active",
        created_at=api_key.created_at,
        last_used_at=api_key.last_used_at,
    )


@router.post(
    "/{api_key_id}/revoke",
    response_model=ApiKeyResponse,
    summary="Revogar API Key",
    description="Marca uma API key como inativa/revogada.",
)
def revoke_api_key(
    api_key_id: int,
    org: Organization = Depends(get_current_organization_from_user),
    db: Session = Depends(get_db),
):
    """
    Revoga uma API key, tornando-a inativa.
    
    Requer autenticação JWT.
    
    Args:
        api_key_id: ID da API key a ser revogada.
        
    Returns:
        API key atualizada.
    """
    # Buscar API key
    api_key = (
        db.query(ApiKey)
        .filter(ApiKey.id == api_key_id, ApiKey.organization_id == org.id)
        .first()
    )
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"API key com ID {api_key_id} nao encontrada."
        )
    
    if not api_key.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta API key ja esta revogada."
        )
    
    # Revogar
    api_key.is_active = False
    api_key.last_used_at = datetime.utcnow()  # Marca quando foi revogada
    
    db.commit()
    db.refresh(api_key)
    
    return api_key_to_response(api_key)

