"""
Dependências compartilhadas da API.
===================================
Inclui autenticação por API key, JWT e outras dependências.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from fastapi import Depends, HTTPException, Request, Security, status
from fastapi.security import APIKeyHeader, OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import ApiKey, Organization, User
from app.core.security import decode_access_token


@dataclass
class ApiKeyAuth:
    """Resultado da autenticação por API key."""
    organization: Organization
    api_key: ApiKey


# =============================================================================
# API Key Authentication (para endpoints públicos de API)
# =============================================================================

# Definir header de API key
# Aceita tanto "Authorization: Bearer <KEY>" quanto "X-API-Key: <KEY>"
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
authorization_header = APIKeyHeader(name="Authorization", auto_error=False)


# =============================================================================
# JWT Authentication (para dashboard/painel)
# =============================================================================

# OAuth2 scheme para JWT
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/v1/auth/login", auto_error=False)


def extract_api_key(
    x_api_key: Optional[str] = Security(api_key_header),
    authorization: Optional[str] = Security(authorization_header),
) -> Optional[str]:
    """
    Extrai a API key do header.
    
    Aceita:
    - X-API-Key: <API_KEY>
    - Authorization: Bearer <API_KEY>
    
    Returns:
        A API key extraída ou None se não encontrada.
    """
    # Primeiro, tenta X-API-Key
    if x_api_key:
        return x_api_key
    
    # Depois, tenta Authorization: Bearer <KEY>
    if authorization:
        if authorization.lower().startswith("bearer "):
            return authorization[7:]  # Remove "Bearer "
        # Aceita também sem "Bearer " prefix
        return authorization
    
    return None


def get_api_key_auth(
    request: Request,
    api_key: Optional[str] = Depends(extract_api_key),
    db: Session = Depends(get_db),
) -> ApiKeyAuth:
    """
    Dependência que valida a API key e retorna organização + API key.
    
    Também armazena o api_key_id no request.state para uso posterior (logging).
    
    Args:
        request: Objeto Request do FastAPI
        api_key: API key extraída do header
        db: Sessão do banco de dados
        
    Returns:
        ApiKeyAuth com Organization e ApiKey associados
        
    Raises:
        HTTPException 401: Se a API key não for fornecida, inválida ou inativa
    """
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Buscar API key no banco
    api_key_record = (
        db.query(ApiKey)
        .filter(ApiKey.key == api_key)
        .first()
    )
    
    if not api_key_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verificar se está ativa
    if not api_key_record.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Atualizar last_used_at
    api_key_record.last_used_at = datetime.utcnow()
    db.commit()
    
    # Carregar a organização
    organization = (
        db.query(Organization)
        .filter(Organization.id == api_key_record.organization_id)
        .first()
    )
    
    if not organization:
        # Não deveria acontecer se FK está correta, mas por segurança
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Armazenar api_key_id no request.state para uso no logging
    request.state.api_key_id = api_key_record.id
    
    return ApiKeyAuth(organization=organization, api_key=api_key_record)


def get_current_organization_from_api_key(
    auth: ApiKeyAuth = Depends(get_api_key_auth),
) -> Organization:
    """
    Dependência que valida a API key e retorna apenas a organização.
    
    Mantida para compatibilidade com código existente.
    
    Args:
        auth: Resultado da autenticação por API key
        
    Returns:
        Organization associada à API key válida
    """
    return auth.organization


# =============================================================================
# JWT User Authentication (para dashboard)
# =============================================================================

def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependência que valida o JWT e retorna o usuário autenticado.
    
    Args:
        token: JWT extraído do header Authorization: Bearer <token>
        db: Sessão do banco de dados
        
    Returns:
        User autenticado com sua Organization carregada
        
    Raises:
        HTTPException 401: Se o token não for fornecido, inválido ou expirado
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não autenticado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise credentials_exception
    
    # Decodificar e validar token
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    # Extrair user_id do token
    user_id_str: str = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception
    
    try:
        user_id = int(user_id_str)
    except ValueError:
        raise credentials_exception
    
    # Buscar usuário no banco
    user = db.query(User).filter(User.id == user_id).first()
    
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário desativado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


def get_current_organization_from_user(
    current_user: User = Depends(get_current_user),
) -> Organization:
    """
    Dependência que retorna a organização do usuário autenticado.
    
    Útil para endpoints de dashboard que precisam da organização.
    
    Args:
        current_user: Usuário autenticado via JWT
        
    Returns:
        Organization do usuário
    """
    return current_user.organization

