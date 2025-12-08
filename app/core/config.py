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


settings = Settings()

