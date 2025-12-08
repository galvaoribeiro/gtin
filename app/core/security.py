"""
Módulo de segurança - JWT e senhas.
====================================
Funções para criar/validar tokens JWT e hash de senhas.
"""

from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
import bcrypt

from app.core.config import settings


# =============================================================================
# Funções de Hash de Senha
# =============================================================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica se a senha em texto plano corresponde ao hash.
    
    Args:
        plain_password: Senha em texto plano
        hashed_password: Hash bcrypt da senha
        
    Returns:
        True se a senha corresponde, False caso contrário
    """
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8")
    )


def get_password_hash(password: str) -> str:
    """
    Gera hash bcrypt de uma senha.
    
    Args:
        password: Senha em texto plano
        
    Returns:
        Hash bcrypt da senha
    """
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


# =============================================================================
# Funções de JWT
# =============================================================================

def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Cria um token JWT de acesso.
    
    Args:
        data: Dados a serem codificados no token (geralmente {"sub": user_id})
        expires_delta: Tempo de expiração opcional
        
    Returns:
        Token JWT como string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decodifica e valida um token JWT.
    
    Args:
        token: Token JWT como string
        
    Returns:
        Payload do token se válido, None se inválido ou expirado
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        return None

