"""
Modelos SQLAlchemy para Organizations, Users e API Keys.
========================================================
Define as tabelas para autenticação e controle de acesso.
"""

import secrets
from datetime import datetime, date
from typing import Optional

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship, DeclarativeBase


class Base(DeclarativeBase):
    """Classe base para todos os modelos SQLAlchemy."""
    pass


class Organization(Base):
    """
    Modelo para organizações/clientes.
    
    Cada organização pode ter múltiplas API keys e um plano de uso.
    Planos: basic (grátis), starter, pro, advanced
    """
    __tablename__ = "organizations"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False, comment="Nome da organização/cliente")
    plan = Column(String(50), nullable=False, default="basic", comment="Plano: basic, starter, pro, advanced")
    daily_limit = Column(Integer, nullable=False, default=15, comment="Limite de consultas por dia")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Campos Stripe
    stripe_customer_id = Column(String(255), nullable=True, unique=True, index=True, comment="ID do customer no Stripe")
    stripe_subscription_id = Column(String(255), nullable=True, index=True, comment="ID da subscription ativa no Stripe")
    subscription_status = Column(String(50), nullable=True, comment="Status da subscription: active, past_due, canceled, etc")
    current_period_end = Column(DateTime, nullable=True, comment="Data de término do período atual de cobrança")
    default_payment_method = Column(String(255), nullable=True, comment="ID do método de pagamento padrão")
    
    # Relacionamento com API keys
    api_keys = relationship("ApiKey", back_populates="organization", cascade="all, delete-orphan")
    # Relacionamento com usuários
    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Organization(id={self.id}, name='{self.name}', plan='{self.plan}')>"
    
    def get_daily_limit_by_plan(self) -> int:
        """Retorna o limite diário baseado no plano."""
        limits = {
            "basic": 15,
            "starter": 200,
            "pro": 400,
            "advanced": 1000,
        }
        return limits.get(self.plan, 15)

    def get_batch_limit_by_plan(self) -> int:
        """Retorna o limite de GTINs por batch de acordo com o plano."""
        limits = {
            "basic": 0,       # batch desabilitado
            "starter": 2,
            "pro": 5,
            "advanced": 10,
        }
        return limits.get(self.plan, 0)

    @property
    def batch_limit(self) -> int:
        """Propriedade de conveniência para uso em serialização/respostas."""
        return self.get_batch_limit_by_plan()


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


class ApiKeyUsageDaily(Base):
    """
    Modelo para registrar uso diário por API Key.
    
    Armazena contadores de sucesso/erro por dia (fuso America/Sao_Paulo).
    """
    __tablename__ = "api_key_usage_daily"
    __table_args__ = (
        UniqueConstraint("api_key_id", "usage_date", name="uq_api_key_usage_daily"),
    )
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    api_key_id = Column(Integer, ForeignKey("api_keys.id", ondelete="CASCADE"), nullable=False, index=True)
    usage_date = Column(Date, nullable=False, index=True, comment="Data do uso (America/Sao_Paulo)")
    success_count = Column(Integer, nullable=False, default=0, comment="Total de chamadas com sucesso (2xx)")
    error_count = Column(Integer, nullable=False, default=0, comment="Total de chamadas com erro (4xx/5xx)")
    
    # Relacionamento com API Key
    api_key = relationship("ApiKey", backref="usage_records")
    
    def __repr__(self) -> str:
        return f"<ApiKeyUsageDaily(api_key_id={self.api_key_id}, date={self.usage_date}, success={self.success_count}, error={self.error_count})>"

