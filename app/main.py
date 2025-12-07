"""
GTIN→NCM Data Platform - Backend API
=====================================
Serviço FastAPI para consulta de dados GTIN/NCM.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.session import test_db_connection
from app.api.v1.gtins import router as gtins_router

# Criar aplicação FastAPI
app = FastAPI(
    title="GTIN→NCM Data Platform API",
    description="API para consulta de dados de produtos por GTIN (código de barras)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
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

