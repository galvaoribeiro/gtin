-- Migration 008: Preço Enterprise customizado por organização
-- Idempotente: usa IF NOT EXISTS

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS enterprise_price_id VARCHAR(255);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS enterprise_amount_cents INTEGER;
