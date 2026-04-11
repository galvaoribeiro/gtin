"""
Configurações da aplicação.
============================
Carrega variáveis de ambiente e define configurações padrão.
"""

import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()


class Settings:
    """Configurações da aplicação."""
    
    # JWT Settings
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your-super-secret-key-change-in-production")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    
    # Stripe Settings
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_PUBLISHABLE_KEY: str = os.getenv("STRIPE_PUBLISHABLE_KEY", "")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    
    # Stripe Price IDs por plano
    STRIPE_PRICE_STARTER: str = os.getenv("STRIPE_PRICE_STARTER", "")
    STRIPE_PRICE_PRO: str = os.getenv("STRIPE_PRICE_PRO", "")
    # Mantém fallback para variável antiga STRIPE_PRICE_ENTERPRISE
    STRIPE_PRICE_ADVANCED: str = os.getenv(
        "STRIPE_PRICE_ADVANCED",
        os.getenv("STRIPE_PRICE_ENTERPRISE", ""),
    )
    
    # Redis Settings (para rate limiting)
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    REDIS_ENABLED: bool = os.getenv("REDIS_ENABLED", "true").lower() in ("true", "1", "yes")

    # Password Reset
    FRONTEND_BASE_URL: str = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("PASSWORD_RESET_TOKEN_EXPIRE_MINUTES", "30"))

    # SMTP (e-mail)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM: str = os.getenv("SMTP_FROM", "Pesquisa GTIN <no-reply@pesquisagtin.com.br>")
    SMTP_USE_TLS: bool = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")
    SMTP_USE_SSL: bool = os.getenv("SMTP_USE_SSL", "false").lower() in ("true", "1", "yes")

    # Search backend
    SEARCH_BACKEND: str = os.getenv("SEARCH_BACKEND", "postgres").lower()

    # Meilisearch Settings
    MEILI_URL: str = os.getenv("MEILI_URL", "").rstrip("/")
    MEILI_API_KEY: str = os.getenv("MEILI_API_KEY", "")
    MEILI_INDEX_PRODUCTS: str = os.getenv("MEILI_INDEX_PRODUCTS", "products")
    MEILI_TIMEOUT_SECONDS: float = float(os.getenv("MEILI_TIMEOUT_SECONDS", "60"))


settings = Settings()

