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
from app.api.v1.auth import router as auth_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.metrics import router as metrics_router
from app.api.v1.public import router as public_router
from app.api.v1.billing import router as billing_router


def run_migrations():
    """
    Executa migrações pendentes.
    Verifica e adiciona colunas/tabelas necessárias.
    """
    from sqlalchemy import text
    from app.db.session import engine
    
    try:
        with engine.connect() as conn:
            # Migração 1: Adicionar coluna 'name' na tabela api_keys
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
            
            # Migração 2: Criar tabela 'users' se não existir
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_name = 'users'
            """))
            
            if not result.fetchone():
                print("[MIGRATION] Criando tabela 'users'...")
                conn.execute(text("""
                    CREATE TABLE users (
                        id SERIAL PRIMARY KEY,
                        email VARCHAR(255) NOT NULL UNIQUE,
                        hashed_password VARCHAR(255) NOT NULL,
                        organization_id INTEGER NOT NULL REFERENCES organizations(id),
                        is_active BOOLEAN NOT NULL DEFAULT TRUE,
                        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                conn.execute(text("""
                    CREATE INDEX ix_users_email ON users(email)
                """))
                conn.commit()
                print("[MIGRATION] Tabela 'users' criada com sucesso!")
            else:
                print("[MIGRATION] Tabela 'users' ja existe.")
            
            # Migração 3: Verificar/corrigir tabela 'api_key_usage_daily'
            # Primeiro verificar se a tabela tem estrutura errada (coluna 'date' em vez de 'usage_date')
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'api_key_usage_daily' AND column_name = 'date'
            """))
            if result.fetchone():
                print("[MIGRATION] Tabela 'api_key_usage_daily' com estrutura incorreta. Recriando...")
                conn.execute(text("DROP TABLE IF EXISTS api_key_usage_daily CASCADE"))
                conn.commit()
            
            # Criar tabela se não existir
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_name = 'api_key_usage_daily'
            """))
            
            if not result.fetchone():
                print("[MIGRATION] Criando tabela 'api_key_usage_daily'...")
                conn.execute(text("""
                    CREATE TABLE api_key_usage_daily (
                        id SERIAL PRIMARY KEY,
                        api_key_id INTEGER NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
                        usage_date DATE NOT NULL,
                        success_count INTEGER NOT NULL DEFAULT 0,
                        error_count INTEGER NOT NULL DEFAULT 0,
                        CONSTRAINT uq_api_key_usage_daily UNIQUE (api_key_id, usage_date)
                    )
                """))
                conn.execute(text("""
                    CREATE INDEX ix_api_key_usage_daily_api_key_id ON api_key_usage_daily(api_key_id)
                """))
                conn.execute(text("""
                    CREATE INDEX ix_api_key_usage_daily_usage_date ON api_key_usage_daily(usage_date)
                """))
                conn.commit()
                print("[MIGRATION] Tabela 'api_key_usage_daily' criada com sucesso!")
            else:
                print("[MIGRATION] Tabela 'api_key_usage_daily' ja existe.")
            
            # Garantir que a coluna usage_date exista (ambientes criados antes desta coluna)
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'api_key_usage_daily' AND column_name = 'usage_date'
            """))
            if not result.fetchone():
                print("[MIGRATION] Adicionando coluna 'usage_date' em api_key_usage_daily...")
                conn.execute(text("ALTER TABLE api_key_usage_daily ADD COLUMN usage_date DATE"))
                conn.execute(text("UPDATE api_key_usage_daily SET usage_date = CURRENT_DATE WHERE usage_date IS NULL"))
                conn.execute(text("ALTER TABLE api_key_usage_daily ALTER COLUMN usage_date SET NOT NULL"))
                conn.commit()
                print("[MIGRATION] Coluna 'usage_date' adicionada com sucesso.")
            
            # Garantir que as colunas de contagem existam (ambientes legados)
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'api_key_usage_daily' AND column_name = 'success_count'
            """))
            if not result.fetchone():
                print("[MIGRATION] Adicionando coluna 'success_count' em api_key_usage_daily...")
                conn.execute(text("ALTER TABLE api_key_usage_daily ADD COLUMN success_count INTEGER"))
                conn.execute(text("UPDATE api_key_usage_daily SET success_count = 0 WHERE success_count IS NULL"))
                conn.execute(text("ALTER TABLE api_key_usage_daily ALTER COLUMN success_count SET NOT NULL"))
                conn.execute(text("ALTER TABLE api_key_usage_daily ALTER COLUMN success_count SET DEFAULT 0"))
                conn.commit()
                print("[MIGRATION] Coluna 'success_count' adicionada com sucesso.")
            
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'api_key_usage_daily' AND column_name = 'error_count'
            """))
            if not result.fetchone():
                print("[MIGRATION] Adicionando coluna 'error_count' em api_key_usage_daily...")
                conn.execute(text("ALTER TABLE api_key_usage_daily ADD COLUMN error_count INTEGER"))
                conn.execute(text("UPDATE api_key_usage_daily SET error_count = 0 WHERE error_count IS NULL"))
                conn.execute(text("ALTER TABLE api_key_usage_daily ALTER COLUMN error_count SET NOT NULL"))
                conn.execute(text("ALTER TABLE api_key_usage_daily ALTER COLUMN error_count SET DEFAULT 0"))
                conn.commit()
                print("[MIGRATION] Coluna 'error_count' adicionada com sucesso.")
            
            # Garantir índices e unique constraint necessários
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_api_key_usage_daily_api_key_id 
                ON api_key_usage_daily(api_key_id)
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_api_key_usage_daily_usage_date 
                ON api_key_usage_daily(usage_date)
            """))
            conn.execute(text("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.table_constraints 
                        WHERE table_name = 'api_key_usage_daily' 
                          AND constraint_name = 'uq_api_key_usage_daily'
                    ) THEN
                        ALTER TABLE api_key_usage_daily 
                            ADD CONSTRAINT uq_api_key_usage_daily UNIQUE (api_key_id, usage_date);
                    END IF;
                END $$;
            """))
            conn.commit()
            
            # Migração 4: Adicionar campos Stripe na tabela organizations
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'organizations' AND column_name = 'stripe_customer_id'
            """))
            
            if not result.fetchone():
                print("[MIGRATION] Adicionando campos Stripe na tabela organizations...")
                conn.execute(text("""
                    ALTER TABLE organizations
                    ADD COLUMN stripe_customer_id VARCHAR(255) NULL,
                    ADD COLUMN stripe_subscription_id VARCHAR(255) NULL,
                    ADD COLUMN subscription_status VARCHAR(50) NULL,
                    ADD COLUMN current_period_end TIMESTAMP NULL,
                    ADD COLUMN default_payment_method VARCHAR(255) NULL
                """))
                conn.execute(text("""
                    CREATE UNIQUE INDEX ix_organizations_stripe_customer_id 
                    ON organizations(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL
                """))
                conn.execute(text("""
                    CREATE INDEX ix_organizations_stripe_subscription_id 
                    ON organizations(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL
                """))
                conn.commit()
                print("[MIGRATION] Campos Stripe adicionados com sucesso!")
            else:
                print("[MIGRATION] Campos Stripe ja existem.")
            
            # Migração 5: Remover coluna image_url de products (ambiente dev)
            result = conn.execute(text("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'products' AND column_name = 'image_url'
            """))
            if result.fetchone():
                print("[MIGRATION] Removendo coluna 'image_url' da tabela products...")
                conn.execute(text("ALTER TABLE products DROP COLUMN IF EXISTS image_url"))
                conn.commit()
                print("[MIGRATION] Coluna 'image_url' removida.")
            else:
                print("[MIGRATION] Coluna 'image_url' ja removida ou inexistente.")
            
            # Migração 6: Remover colunas dsit_date e updated_at de todas as tabelas (ambiente dev)
            print("[MIGRATION] Removendo colunas 'dsit_date' e 'updated_at' (todas as tabelas)...")
            conn.execute(text("""
                DO $$
                DECLARE
                    rec RECORD;
                BEGIN
                    FOR rec IN
                        SELECT table_schema, table_name, column_name
                        FROM information_schema.columns
                        WHERE column_name IN ('dsit_date', 'updated_at')
                          AND table_schema NOT IN ('pg_catalog', 'information_schema')
                    LOOP
                        EXECUTE format(
                            'ALTER TABLE %I.%I DROP COLUMN IF EXISTS %I',
                            rec.table_schema,
                            rec.table_name,
                            rec.column_name
                        );
                    END LOOP;
                END;
                $$;
            """))
            conn.commit()
            print("[MIGRATION] Colunas 'dsit_date' e 'updated_at' removidas (se existiam).")
            
            # Migração 7: Remover coluna owner_tax_id de todas as tabelas (ambiente dev)
            print("[MIGRATION] Removendo coluna 'owner_tax_id' (todas as tabelas)...")
            conn.execute(text("""
                DO $$
                DECLARE
                    rec RECORD;
                BEGIN
                    FOR rec IN
                        SELECT table_schema, table_name, column_name
                        FROM information_schema.columns
                        WHERE column_name = 'owner_tax_id'
                          AND table_schema NOT IN ('pg_catalog', 'information_schema')
                    LOOP
                        EXECUTE format(
                            'ALTER TABLE %I.%I DROP COLUMN IF EXISTS %I',
                            rec.table_schema,
                            rec.table_name,
                            rec.column_name
                        );
                    END LOOP;
                END;
                $$;
            """))
            conn.commit()
            print("[MIGRATION] Coluna 'owner_tax_id' removida (se existia).")
                
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
app.include_router(public_router)  # Público (sem auth)
app.include_router(gtins_router)
app.include_router(api_keys_router)
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(metrics_router)
app.include_router(billing_router)

