"""
Endpoints de autenticação.
===========================
Implementa login, logout e informações do usuário autenticado.
"""

from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import User, Organization
from app.schemas.user import UserLogin, Token, UserResponse, UserRegister
from app.core.security import verify_password, create_access_token, get_password_hash
from app.core.config import settings
from app.api.deps import get_current_user


router = APIRouter(prefix="/v1/auth", tags=["Auth"])


# =============================================================================
# Endpoints
# =============================================================================

@router.post(
    "/login",
    response_model=Token,
    summary="Login de usuário",
    description="Autentica um usuário com email e senha, retornando um token JWT.",
    responses={
        200: {"description": "Login bem sucedido"},
        401: {"description": "Credenciais inválidas"},
    }
)
def login(
    credentials: UserLogin,
    db: Session = Depends(get_db),
):
    """
    Autentica um usuário e retorna um token JWT.
    
    - **email**: Email do usuário
    - **password**: Senha do usuário
    
    Returns:
        Token JWT de acesso
    """
    # Buscar usuário pelo email
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verificar senha
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verificar se o usuário está ativo
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário desativado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Criar token JWT
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=access_token_expires,
    )
    
    return Token(access_token=access_token, token_type="bearer")


@router.post(
    "/register",
    response_model=Token,
    summary="Registro de novo usuário",
    description="Cria uma nova organização e usuário, retornando um token JWT para login automático.",
    responses={
        200: {"description": "Registro bem sucedido"},
        400: {"description": "Email já cadastrado"},
    }
)
def register(
    data: UserRegister,
    db: Session = Depends(get_db),
):
    """
    Registra um novo usuário criando automaticamente uma organização.
    
    - **email**: Email do usuário (único)
    - **password**: Senha (mínimo 8 caracteres)
    - **organization_name**: Nome da organização/empresa
    
    Returns:
        Token JWT de acesso (login automático)
    """
    # Verificar se email já existe
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este email já está cadastrado",
        )
    
    # Criar organização com plano basic (gratuito)
    organization = Organization(
        name=data.organization_name,
        plan="basic",
        daily_limit=15,
    )
    db.add(organization)
    db.flush()  # Para obter o ID da organização
    
    # Criar usuário
    user = User(
        email=data.email,
        hashed_password=get_password_hash(data.password),
        organization_id=organization.id,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Criar token JWT para login automático
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=access_token_expires,
    )
    
    return Token(access_token=access_token, token_type="bearer")


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Dados do usuário autenticado",
    description="Retorna informações do usuário autenticado via JWT.",
    responses={
        200: {"description": "Dados do usuário"},
        401: {"description": "Não autenticado"},
    }
)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Retorna os dados do usuário autenticado.
    
    Requer autenticação via JWT (Bearer token).
    """
    organization = current_user.organization
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        organization_id=current_user.organization_id,
        organization_name=organization.name if organization else None,
        plan=organization.plan if organization else None,
        daily_limit=organization.daily_limit if organization else None,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
    )

