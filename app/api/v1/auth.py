"""
Endpoints de autenticação.
===========================
Implementa login, logout, informações do usuário autenticado e recuperação de senha.
"""

import hashlib
import logging
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import User, Organization
from app.schemas.user import (
    UserLogin, Token, UserResponse, UserRegister, UserUpdate,
    ForgotPasswordRequest, ResetPasswordRequest, MessageResponse,
)
from app.core.security import verify_password, create_access_token, get_password_hash, decode_access_token
from app.core.config import settings
from app.api.deps import get_current_user, oauth2_scheme
from app.services.email_service import send_password_reset_email

logger = logging.getLogger(__name__)


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
def get_me(
    current_user: User = Depends(get_current_user),
    token: str = Depends(oauth2_scheme),
):
    """
    Retorna os dados do usuário autenticado.
    
    Requer autenticação via JWT (Bearer token).
    """
    organization = current_user.organization

    payload = (decode_access_token(token) or {}) if token else {}
    impersonated = bool(payload.get("impersonated"))
    actor_user_id = payload.get("actor_sub")
    actor_email = payload.get("actor_email")
    try:
        actor_user_id = int(actor_user_id) if actor_user_id is not None else None
    except (TypeError, ValueError):
        actor_user_id = None

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        organization_id=current_user.organization_id,
        organization_name=organization.name if organization else None,
        plan=organization.plan if organization else None,
        monthly_limit=organization.monthly_limit if organization else None,
        role=getattr(current_user, "role", "user") or "user",
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        impersonated=impersonated,
        actor_user_id=actor_user_id,
        actor_email=actor_email,
    )


@router.put(
    "/me",
    response_model=UserResponse,
    summary="Atualizar dados do usuário/organização",
    description="Atualiza email do usuário e/ou nome da organização.",
    responses={
        200: {"description": "Dados atualizados"},
        400: {"description": "Email já cadastrado"},
        401: {"description": "Não autenticado"},
    }
)
def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    """
    Atualiza email do usuário autenticado e/ou nome da organização.
    """
    organization = current_user.organization

    # Atualizar email se enviado
    if data.email and data.email != current_user.email:
        existing_user = db.query(User).filter(
            User.email == data.email,
            User.id != current_user.id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este email já está cadastrado",
            )
        current_user.email = data.email

    # Atualizar nome da organização se enviado
    if data.organization_name and organization:
        organization.name = data.organization_name

    db.commit()
    db.refresh(current_user)
    if organization:
        db.refresh(organization)

    payload = (decode_access_token(token) or {}) if token else {}
    impersonated = bool(payload.get("impersonated"))
    actor_user_id = payload.get("actor_sub")
    actor_email = payload.get("actor_email")
    try:
        actor_user_id = int(actor_user_id) if actor_user_id is not None else None
    except (TypeError, ValueError):
        actor_user_id = None

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        organization_id=current_user.organization_id,
        organization_name=organization.name if organization else None,
        plan=organization.plan if organization else None,
        monthly_limit=organization.monthly_limit if organization else None,
        role=getattr(current_user, "role", "user") or "user",
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        impersonated=impersonated,
        actor_user_id=actor_user_id,
        actor_email=actor_email,
    )


# =============================================================================
# Password Reset
# =============================================================================

def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


_FORGOT_GENERIC_MSG = (
    "Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha."
)


@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    summary="Solicitar recuperação de senha",
    description="Envia e-mail com link para redefinição de senha. Não revela se o e-mail existe.",
    responses={
        200: {"description": "Solicitação processada (sempre 200)"},
    },
)
def forgot_password(
    data: ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    _apply_forgot_rate_limit(request)

    user = db.query(User).filter(User.email == data.email).first()

    if user and user.is_active:
        raw_token = secrets.token_urlsafe(32)
        token_hash = _hash_token(raw_token)

        user.password_reset_token_hash = token_hash
        user.password_reset_expires_at = (
            datetime.utcnow()
            + timedelta(minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES)
        )
        user.password_reset_used_at = None
        db.commit()

        reset_link = (
            f"{settings.FRONTEND_BASE_URL.rstrip('/')}/reset-password?token={raw_token}"
        )

        try:
            send_password_reset_email(user.email, reset_link)
        except Exception:
            logger.exception("Falha ao enviar e-mail de reset para %s", user.email)

    return MessageResponse(detail=_FORGOT_GENERIC_MSG)


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    summary="Redefinir senha",
    description="Recebe o token enviado por e-mail e uma nova senha.",
    responses={
        200: {"description": "Senha redefinida com sucesso"},
        400: {"description": "Token inválido, expirado ou já utilizado"},
    },
)
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    token_hash = _hash_token(data.token)

    user = (
        db.query(User)
        .filter(User.password_reset_token_hash == token_hash)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido ou expirado.",
        )

    if user.password_reset_used_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este link já foi utilizado. Solicite um novo.",
        )

    if (
        user.password_reset_expires_at is None
        or datetime.utcnow() > user.password_reset_expires_at
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token expirado. Solicite um novo link.",
        )

    user.hashed_password = get_password_hash(data.new_password)
    user.password_reset_used_at = datetime.utcnow()
    user.password_reset_token_hash = None
    user.password_reset_expires_at = None
    db.commit()

    return MessageResponse(detail="Senha redefinida com sucesso.")


# =============================================================================
# Rate limit helpers (forgot-password)
# =============================================================================

_FORGOT_COOLDOWN_SECONDS = 10
_FORGOT_DAILY_LIMIT = 10


def _apply_forgot_rate_limit(request: Request) -> None:
    """Rate limit por IP para forgot-password (fail-open se Redis indisponível)."""
    try:
        from app.core.rate_limit import redis_rate_limiter, get_client_ip

        ip = get_client_ip(request)

        allowed, retry_after = redis_rate_limiter.check_cooldown(
            key=f"rl:ip:{ip}:forgot:cooldown",
            cooldown_seconds=_FORGOT_COOLDOWN_SECONDS,
        )
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Aguarde alguns segundos antes de tentar novamente.",
                headers={"Retry-After": str(retry_after)},
            )

        allowed, _remaining, retry_after = redis_rate_limiter.check_daily_limit_until_midnight(
            key=f"rl:ip:{ip}:forgot:daily",
            daily_limit=_FORGOT_DAILY_LIMIT,
        )
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Limite diário de solicitações atingido. Tente novamente amanhã.",
                headers={"Retry-After": str(retry_after)},
            )
    except HTTPException:
        raise
    except Exception:
        pass

