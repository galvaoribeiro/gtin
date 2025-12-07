"""
GTIN→NCM Data Platform - Backend API
=====================================
Serviço FastAPI para consulta de dados GTIN/NCM.
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.session import test_db_connection, create_tables, SessionLocal
from app.db.seed import seed_initial_data
from app.api.v1.gtins import router as gtins_router
from app.api.v1.api_keys import router as api_keys_router


def run_migrations():
    """
    Executa migrações pendentes.
    Por enquanto, apenas verifica e adiciona a coluna 'name' na tabela api_keys.
    """
    from sqlalchemy import text
    from app.db.session import engine
    
    try:
        with engine.connect() as conn:
            # Verificar se a coluna 'name' existe
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'api_keys' AND column_name = 'name'
            """))
            
            if not result.fetchone():
                print("[MIGRATION] Adicionando coluna 'name' na tabela api_keys...")
                conn.execute(text("""
                    ALTER TABLE api_keys 
                    ADD COLUMN name VARCHAR(100) DEFAULT 'Nova chave'
                """))
                conn.commit()
                print("[MIGRATION] Coluna 'name' adicionada com sucesso!")
            else:
                print("[MIGRATION] Coluna 'name' ja existe.")
    except Exception as e:
        print(f"[MIGRATION] Erro ao executar migracoes: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gerencia o ciclo de vida da aplicação.
    Executa setup no startup e cleanup no shutdown.
    """
    # Startup: criar tabelas e executar seed em ambiente de desenvolvimento
    if os.getenv("ENVIRONMENT", "development") == "development":
        print("[STARTUP] Iniciando em modo desenvolvimento...")
        print("[STARTUP] Criando tabelas...")
        create_tables()
        print("[STARTUP] Tabelas criadas/verificadas!")
        
        print("[STARTUP] Executando migracoes...")
        run_migrations()
        
        print("[STARTUP] Executando seed...")
        db = SessionLocal()
        try:
            seed_initial_data(db)
        finally:
            db.close()
        print("[STARTUP] Seed concluido!")
    
    yield  # Aplicação rodando
    
    # Shutdown: cleanup se necessário
    print("[SHUTDOWN] Encerrando aplicacao...")

# Criar aplicação FastAPI
app = FastAPI(
    title="GTIN→NCM Data Platform API",
    description="API para consulta de dados de produtos por GTIN (código de barras). Requer autenticação via API key.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configurar CORS para permitir acesso do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especificar domínios permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
def health_check():
    """
    Endpoint de verificação de saúde da API.
    Retorna status "ok" se a API estiver funcionando.
    """
    return {"status": "ok"}


@app.get("/health/db", tags=["Health"])
def health_check_db():
    """
    Endpoint de verificação de saúde da conexão com o banco de dados.
    Executa SELECT 1 para confirmar que a conexão está funcionando.
    """
    if test_db_connection():
        return {"status": "ok", "database": "connected"}
    else:
        return {"status": "error", "database": "disconnected"}


# Incluir routers da API v1
app.include_router(gtins_router)
app.include_router(api_keys_router)

