"""
Dependências compartilhadas da API.
===================================
Inclui autenticação por API key e outras dependências.
"""

from datetime import datetime
from typing import Optional

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import ApiKey, Organization


# Definir header de API key
# Aceita tanto "Authorization: Bearer <KEY>" quanto "X-API-Key: <KEY>"
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
authorization_header = APIKeyHeader(name="Authorization", auto_error=False)


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


def get_current_organization_from_api_key(
    api_key: Optional[str] = Depends(extract_api_key),
    db: Session = Depends(get_db),
) -> Organization:
    """
    Dependência que valida a API key e retorna a organização associada.
    
    Args:
        api_key: API key extraída do header
        db: Sessão do banco de dados
        
    Returns:
        Organization associada à API key válida
        
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
    
    # Carregar e retornar a organização
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
    
    return organization

