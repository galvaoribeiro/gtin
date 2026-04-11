-- Migration 007: Adicionar campos de recuperação de senha na tabela users
-- Idempotente: usa IF NOT EXISTS

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token_hash VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_used_at TIMESTAMP NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_password_reset_token_hash
    ON users(password_reset_token_hash)
    WHERE password_reset_token_hash IS NOT NULL;
