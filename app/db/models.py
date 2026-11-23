"""
Modelos SQLAlchemy para Organizations, Users e API Keys.
========================================================
Define as tabelas para autenticação e controle de acesso.
"""

import secrets
from datetime import datetime, date
from typing import Optional

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship, DeclarativeBase


class Base(DeclarativeBase):
    """Classe base para todos os modelos SQLAlchemy."""
    pass


# Plano gratuito. Novos cadastros usam este slug.
FREE_PLAN = "free"

# Slug reutilizado: até a introdução do Basic pago, "basic" era o plano
# gratuito (100 consultas/mês, sem Stripe). Contas nesse slug sem entitlement
# Stripe continuam no Free; com assinatura paga, "basic" é o plano Basic.
LEGACY_FREE_PLAN_SLUG = "basic"

# Planos que o cliente pode contratar sozinho pelo self-service.
PUBLIC_PLANS = ("free", "basic", "starter", "pro", "advanced")

# Planos negociados: só podem ser atribuídos por um administrador.
PRIVATE_PLANS = ("enterprise",)

ALL_PLANS = PUBLIC_PLANS + PRIVATE_PLANS

FREE_PLANS = frozenset({FREE_PLAN})

# Planos pagos. Cota desses planos só vale com entitlement (status Stripe
# active/trialing, ou past_due em carência). Sem status gravado (admin/legado)
# o plano da coluna continua valendo — não rebaixa quem nunca passou pelo Stripe.
# Exceção: "basic" sem Stripe ainda é o Free legado (ver is_legacy_free_basic).
PAID_PLANS = frozenset({"basic", "starter", "pro", "advanced", "enterprise"})

# Status em que a org de fato pagou (ou está em trial) e pode receber o plano.
SUBSCRIPTION_STATUSES_ELEVATE_PLAN = frozenset({"active", "trialing"})

# Renovação com falha: carência. Mantém plano já pago; nunca eleva do gratuito.
SUBSCRIPTION_STATUSES_GRACE = frozenset({"past_due"})

# Status que concedem cota paga (elevação + carência).
SUBSCRIPTION_STATUSES_GRANT_PAID_ACCESS = (
    SUBSCRIPTION_STATUSES_ELEVATE_PLAN | SUBSCRIPTION_STATUSES_GRACE
)

# Assinatura encerrada ou nunca chegou a pagar: plano volta para free.
SUBSCRIPTION_STATUSES_REVOKE_PLAN = frozenset({
    "incomplete_expired",
    "canceled",
    "cancelled",
    "unpaid",
    "paused",
})

# Teto padrão de GTINs por requisição em lote: é o limite do plano enterprise
# e o máximo que qualquer plano alcança sem override.
MAX_BATCH_SIZE = 100

# Teto técnico absoluto de GTINs por requisição em lote. Só é alcançável por
# organizações com ``batch_limit_override`` acima de MAX_BATCH_SIZE (definido
# pelo admin); os limites padrão dos planos continuam em MAX_BATCH_SIZE.
HARD_MAX_BATCH_SIZE = 1000

# Limite mensal padrão de consultas (sucessos) por plano.
# O valor efetivo de cada organização é Organization.monthly_limit
# (override da org, se houver; senão este mapa).
PLAN_MONTHLY_LIMITS = {
    "free": 100,
    "basic": 1000,
    "starter": 5000,
    "pro": 20000,
    "advanced": 100000,
    "enterprise": 20000,
}


def ensure_client_ip_columns(bind) -> None:
    """
    Garante colunas de IP de cadastro e de criação de API key.

    Idempotente. Em PostgreSQL usa ADD COLUMN IF NOT EXISTS (seguro com
    mais de um worker no boot). SQLite de teste não aceita essa sintaxe,
    então as colunas são adicionadas só se ainda não existirem.

    Destinado ao boot de produção: o lifespan de desenvolvimento também
    chama este passo, mas produção não aplica o arquivo SQL 010 sozinho.
    Sem as colunas, o código novo quebraria cadastro e criação de chave.

    Não preenche linhas antigas (permanecem NULL). Não grava IP por lookup.
    """
    from sqlalchemy import inspect, text

    statements = []
    if bind.dialect.name == "sqlite":
        inspector = inspect(bind)
        tables = set(inspector.get_table_names())
        user_cols = (
            {col["name"] for col in inspector.get_columns("users")}
            if "users" in tables
            else set()
        )
        key_cols = (
            {col["name"] for col in inspector.get_columns("api_keys")}
            if "api_keys" in tables
            else set()
        )
        if "signup_ip" not in user_cols:
            statements.append("ALTER TABLE users ADD COLUMN signup_ip VARCHAR(45)")
        if "created_ip" not in key_cols:
            statements.append("ALTER TABLE api_keys ADD COLUMN created_ip VARCHAR(45)")
    else:
        statements.extend(
            (
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_ip VARCHAR(45) NULL",
                "ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS created_ip VARCHAR(45) NULL",
            )
        )

    statements.extend(
        (
            """
            CREATE INDEX IF NOT EXISTS ix_users_signup_ip
                ON users(signup_ip)
                WHERE signup_ip IS NOT NULL
            """,
            """
            CREATE INDEX IF NOT EXISTS ix_api_keys_created_ip
                ON api_keys(created_ip)
                WHERE created_ip IS NOT NULL
            """,
        )
    )
    with bind.begin() as conn:
        for sql in statements:
            conn.execute(text(sql))


def clear_stale_free_monthly_overrides(bind) -> int:
    """
    Remove overrides do plano gratuito abaixo do limite padrão atual.

    O limite mensal do Free não é persistido por organização: vem de
    PLAN_MONTHLY_LIMITS. Overrides menores que o novo padrão (por exemplo o
    antigo teto de 5) impediriam a cota de 100/mês de valer imediatamente.
    Planos pagos e contadores de uso não são alterados.

    Returns:
        Quantidade de linhas atualizadas.
    """
    from sqlalchemy import text

    sql = text(
        """
        UPDATE organizations
        SET monthly_limit_override = NULL
        WHERE plan = :plan
          AND monthly_limit_override IS NOT NULL
          AND monthly_limit_override < :new_limit
        """
    )
    with bind.begin() as conn:
        result = conn.execute(
            sql,
            {
                "plan": FREE_PLAN,
                "new_limit": PLAN_MONTHLY_LIMITS[FREE_PLAN],
            },
        )
        return int(result.rowcount or 0)


# Nome antigo, mantido para imports que ainda não foram atualizados.
clear_stale_basic_monthly_overrides = clear_stale_free_monthly_overrides


class Organization(Base):
    """
    Modelo para organizações/clientes.
    
    Cada organização pode ter múltiplas API keys e um plano de uso.
    Planos: free (1 key, 100 consultas/mês, sem batch), basic (pago, 1.000/mês,
    sem batch), starter, pro, advanced, enterprise (negociado, só admin).
    """
    __tablename__ = "organizations"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False, comment="Nome da organização/cliente")
    plan = Column(String(50), nullable=False, default=FREE_PLAN, comment="Plano: free, basic, starter, pro, advanced, enterprise")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Overrides de limites (quando NULL, usa o valor padrão do plano)
    batch_limit_override = Column(Integer, nullable=True, comment="Override do limite de GTINs por batch (NULL = padrão do plano)")
    monthly_limit_override = Column(Integer, nullable=True, comment="Override do limite mensal de chamadas (NULL = padrão do plano)")

    # Campos Stripe
    stripe_customer_id = Column(String(255), nullable=True, unique=True, index=True, comment="ID do customer no Stripe")
    stripe_subscription_id = Column(String(255), nullable=True, index=True, comment="ID da subscription ativa no Stripe")
    subscription_status = Column(String(50), nullable=True, comment="Status da subscription: active, past_due, canceled, etc")
    current_period_end = Column(DateTime, nullable=True, comment="Data de término do período atual de cobrança")
    default_payment_method = Column(String(255), nullable=True, comment="ID do método de pagamento padrão")
    cancel_at_period_end = Column(Boolean, nullable=False, default=False, comment="Se a assinatura será cancelada ao fim do período atual")

    # Preço Enterprise negociado (Price dedicado, customizado por organização)
    enterprise_price_id = Column(String(255), nullable=True, comment="ID do Price Enterprise dedicado desta organização no Stripe")
    enterprise_amount_cents = Column(Integer, nullable=True, comment="Valor mensal negociado do plano Enterprise, em centavos")
    
    # Relacionamento com API keys
    api_keys = relationship("ApiKey", back_populates="organization", cascade="all, delete-orphan")
    # Relacionamento com usuários
    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Organization(id={self.id}, name='{self.name}', plan='{self.plan}')>"
    
    @property
    def is_legacy_free_basic(self) -> bool:
        """
        True quando plan='basic' ainda representa o plano gratuito antigo.

        O slug "basic" foi reutilizado no plano pago. Sem assinatura Stripe
        (nem status que conceda cota paga), a conta continua no Free.
        """
        if (self.plan or "") != LEGACY_FREE_PLAN_SLUG:
            return False
        if self.stripe_subscription_id:
            return False
        status = (self.subscription_status or "").strip().lower()
        return status not in SUBSCRIPTION_STATUSES_GRANT_PAID_ACCESS

    @property
    def has_paid_plan_column(self) -> bool:
        """True se a coluna plan é um slug pago e não o Free legado."""
        if self.is_legacy_free_basic:
            return False
        return (self.plan or FREE_PLAN) in PAID_PLANS

    @property
    def has_paid_entitlement(self) -> bool:
        """
        True quando a organização pode usar cota de plano pago.

        - plan precisa ser pago (basic/starter/pro/advanced/enterprise)
        - "basic" sem Stripe continua sendo o Free legado
        - subscription_status active/trialing, ou past_due (carência de quem já pagou)
        - status vazio/None: plano atribuído fora do Stripe (admin/legado); mantém a cota
        - incomplete, incomplete_expired, canceled, unpaid, paused: sem cota paga
        """
        if not self.has_paid_plan_column:
            return False
        status = (self.subscription_status or "").strip().lower()
        if not status:
            return True
        return status in SUBSCRIPTION_STATUSES_GRANT_PAID_ACCESS

    @property
    def effective_plan(self) -> str:
        """Plano usado para cotas e rate limits. Sem entitlement pago, cai para free."""
        if self.has_paid_entitlement:
            return self.plan
        return FREE_PLAN

    def get_batch_limit_by_plan(self) -> int:
        """Retorna o limite de GTINs por batch de acordo com o plano."""
        limits = {
            "free": 0,        # batch desabilitado
            "basic": 0,       # Basic pago: mesmo comportamento de batch do Free
            "starter": 5,
            "pro": 10,
            "advanced": 20,
            "enterprise": MAX_BATCH_SIZE,
        }
        return limits.get(self.plan, 0)

    @property
    def batch_limit(self) -> int:
        """Retorna o override se definido, caso contrário o padrão do plano efetivo."""
        if not self.has_paid_entitlement and self.has_paid_plan_column:
            return 0
        if self.batch_limit_override is not None:
            return self.batch_limit_override
        return self.get_batch_limit_by_plan()

    def get_monthly_limit_by_plan(self) -> int:
        """Retorna o limite mensal de chamadas de API por organização, de acordo com o plano."""
        if self.is_legacy_free_basic:
            return PLAN_MONTHLY_LIMITS[FREE_PLAN]
        return PLAN_MONTHLY_LIMITS.get(self.plan, 0)

    @property
    def monthly_limit(self) -> int:
        """Retorna o override se definido, caso contrário o padrão do plano efetivo."""
        if not self.has_paid_entitlement and self.has_paid_plan_column:
            return PLAN_MONTHLY_LIMITS[FREE_PLAN]
        if self.monthly_limit_override is not None:
            return self.monthly_limit_override
        return self.get_monthly_limit_by_plan()

    def get_api_key_active_limit_by_plan(self) -> int:
        """Limite de API keys ativas permitido por plano."""
        limits = {
            "free": 1,
            "basic": 1,
            "starter": 1,
            "pro": 10,
            "advanced": 50,
            "enterprise": 50,
        }
        return limits.get(self.plan, 1 if self.is_legacy_free_basic else 0)

    @property
    def api_key_active_limit(self) -> int:
        """Propriedade de conveniência para limite de API keys ativas (plano efetivo)."""
        if not self.has_paid_entitlement and self.has_paid_plan_column:
            return 1
        return self.get_api_key_active_limit_by_plan()


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
    role = Column(String(20), nullable=False, default="user", comment="Papel do usuário: user, admin")
    is_active = Column(Boolean, nullable=False, default=True, comment="Se o usuário está ativo")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    signup_ip = Column(String(45), nullable=True, comment="IP do cliente no momento do cadastro")

    password_reset_token_hash = Column(String(64), nullable=True, unique=True, comment="SHA-256 do token de reset (uso único)")
    password_reset_expires_at = Column(DateTime, nullable=True, comment="Expiração do token de reset")
    password_reset_used_at = Column(DateTime, nullable=True, comment="Quando o token foi usado")
    
    # Relacionamento com organização
    organization = relationship("Organization", back_populates="users")
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}', org_id={self.organization_id})>"


class AdminAuditLog(Base):
    """Log de auditoria para ações administrativas (staff)."""

    __tablename__ = "admin_audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    actor_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    target_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    target_org_id = Column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True)
    payload = Column(JSONB, nullable=True)
    ip = Column(String(64), nullable=True)
    user_agent = Column(String(512), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)

    def __repr__(self) -> str:
        return f"<AdminAuditLog(id={self.id}, action='{self.action}', actor={self.actor_user_id})>"


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
    created_ip = Column(String(45), nullable=True, comment="IP do cliente no momento da criação da chave")
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


class OrganizationUsageMonthly(Base):
    """
    Modelo para registrar uso mensal por organização.
    
    Armazena contadores de sucesso/erro por mês (fuso America/Sao_Paulo).
    """
    __tablename__ = "organization_usage_monthly"
    __table_args__ = (
        UniqueConstraint("organization_id", "usage_month", name="uq_org_usage_monthly"),
    )
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    usage_month = Column(Date, nullable=False, index=True, comment="Primeiro dia do mês de referência (America/Sao_Paulo)")
    success_count = Column(Integer, nullable=False, default=0, comment="Total de chamadas com sucesso (2xx) no mês")
    error_count = Column(Integer, nullable=False, default=0, comment="Total de chamadas com erro (4xx/5xx) no mês")
    
    def __repr__(self) -> str:
        return f"<OrganizationUsageMonthly(org_id={self.organization_id}, month={self.usage_month}, success={self.success_count}, error={self.error_count})>"

