"""
Módulo de conexão com o banco de dados PostgreSQL.
===================================================
Configura o SQLAlchemy engine e sessões para acesso ao banco.
"""

import os
from typing import Generator

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session

# Importar Base para permitir create_all
from app.db.models import Base

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()


def get_database_url() -> str:
    """
    Constrói a URL de conexão do banco de dados.
    Suporta tanto DATABASE_URL direta quanto variáveis PG_* separadas.
    """
    # Primeiro, tenta usar DATABASE_URL se existir
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return database_url
    
    # Caso contrário, constrói a partir das variáveis PG_*
    pg_host = os.getenv("PG_HOST", "localhost")
    pg_port = os.getenv("PG_PORT", "5432")
    pg_db = os.getenv("PG_DB", "gtindata")
    pg_user = os.getenv("PG_USER", "postgres")
    pg_password = os.getenv("PG_PASSWORD", "")
    
    return f"postgresql+psycopg2://{pg_user}:{pg_password}@{pg_host}:{pg_port}/{pg_db}"


# Obter URL de conexão do banco de dados
DATABASE_URL = get_database_url()

# Criar engine SQLAlchemy
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Verifica conexão antes de usar
    pool_size=5,         # Tamanho do pool de conexões
    max_overflow=10,     # Conexões extras permitidas
)

# Criar factory de sessões
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


def get_db() -> Generator[Session, None, None]:
    """
    Dependency que fornece uma sessão do banco de dados.
    Garante que a sessão seja fechada após o uso.
    
    Uso:
        @app.get("/items")
        def get_items(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_db_connection() -> bool:
    """
    Testa a conexão com o banco de dados executando SELECT 1.
    
    Returns:
        True se a conexão estiver funcionando, False caso contrário.
    """
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            result.fetchone()
        return True
    except Exception as e:
        print(f"Erro ao conectar ao banco de dados: {e}")
        return False


def create_tables():
    """
    Cria todas as tabelas definidas nos modelos.
    Útil para ambiente de desenvolvimento.
    """
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    # Teste direto da conexão
    print("Testando conexão com o banco de dados...")
    print(f"DATABASE_URL: {DATABASE_URL[:30]}...")  # Mostra apenas início por segurança
    
    if test_db_connection():
        print("✓ Conexão com o banco de dados estabelecida com sucesso!")
    else:
        print("✗ Falha ao conectar com o banco de dados.")

