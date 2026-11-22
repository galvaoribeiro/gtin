-- Migration 010: IP do cliente no cadastro e na criação de API key
-- Idempotente: ADD COLUMN IF NOT EXISTS / CREATE INDEX IF NOT EXISTS
-- Colunas NULLABLE: registros antigos permanecem NULL.
-- Não grava IP por consulta/lookup.

ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_ip VARCHAR(45) NULL;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS created_ip VARCHAR(45) NULL;

CREATE INDEX IF NOT EXISTS ix_users_signup_ip
    ON users(signup_ip)
    WHERE signup_ip IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_api_keys_created_ip
    ON api_keys(created_ip)
    WHERE created_ip IS NOT NULL;

COMMENT ON COLUMN users.signup_ip IS 'IP do cliente no momento do cadastro (prevenção a abuso)';
COMMENT ON COLUMN api_keys.created_ip IS 'IP do cliente no momento da criação da API key (prevenção a abuso)';
