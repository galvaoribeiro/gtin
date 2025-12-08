"""
Modelos SQLAlchemy para Organizations, Users e API Keys.
========================================================
Define as tabelas para autenticação e controle de acesso.
"""

import secrets
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship, DeclarativeBase


class Base(DeclarativeBase):
    """Classe base para todos os modelos SQLAlchemy."""
    pass


class Organization(Base):
    """
    Modelo para organizações/clientes.
    
    Cada organização pode ter múltiplas API keys e um plano de uso.
    """
    __tablename__ = "organizations"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False, comment="Nome da organização/cliente")
    plan = Column(String(50), nullable=False, default="starter", comment="Plano: starter, pro, enterprise")
    daily_limit = Column(Integer, nullable=False, default=100, comment="Limite de consultas por dia")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relacionamento com API keys
    api_keys = relationship("ApiKey", back_populates="organization", cascade="all, delete-orphan")
    # Relacionamento com usuários
    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Organization(id={self.id}, name='{self.name}', plan='{self.plan}')>"


class User(Base):
    """
    Modelo para usuários do painel administrativo.
    
    Cada usuário pertence a uma organização e pode fazer login no dashboard.
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), nullable=False, unique=True, index=True, comment="Email do usuário")
    hashed_password = Column(String(255), nullable=False, comment="Senha hasheada com bcrypt")
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True, comment="Se o usuário está ativo")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relacionamento com organização
    organization = relationship("Organization", back_populates="users")
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}', org_id={self.organization_id})>"


class ApiKey(Base):
    """
    Modelo para API Keys.
    
    Cada API key pertence a uma organização e pode ser ativada/desativada.
    """
    __tablename__ = "api_keys"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    name = Column(String(100), nullable=True, default="Nova chave", comment="Nome/descricao da API key")
    key = Column(String(64), nullable=False, unique=True, index=True, comment="API Key em texto simples")
    is_active = Column(Boolean, nullable=False, default=True, comment="Se a key esta ativa")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    last_used_at = Column(DateTime, nullable=True, comment="Ultima vez que a key foi usada")
    
    # Relacionamento com organização
    organization = relationship("Organization", back_populates="api_keys")
    
    def __repr__(self) -> str:
        return f"<ApiKey(id={self.id}, org_id={self.organization_id}, active={self.is_active})>"
    
    @staticmethod
    def generate_key() -> str:
        """
        Gera uma API key segura com prefixo sk_live_.
        
        Returns:
            String no formato sk_live_XXXXXXXX (32 chars random).
        """
        return f"sk_live_{secrets.token_hex(16)}"
    
    def get_masked_key(self) -> str:
        """
        Retorna a key mascarada para exibicao segura.
        
        Returns:
            String no formato sk_live_XXXX...XXXX
        """
        if len(self.key) > 16:
            return f"{self.key[:12]}...{self.key[-4:]}"
        return f"{self.key[:4]}...{self.key[-4:]}"

