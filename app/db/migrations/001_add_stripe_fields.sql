-- Migration: Add Stripe fields to organizations table
-- Created: 2025-12-22
-- Description: Adiciona campos para integração com Stripe (customer_id, subscription_id, status, etc)

-- Adicionar campos Stripe
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS default_payment_method VARCHAR(255) NULL;

-- Adicionar índices únicos e de busca
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_stripe_customer_id 
ON organizations(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_stripe_subscription_id 
ON organizations(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

-- Adicionar comentários nas colunas
COMMENT ON COLUMN organizations.stripe_customer_id IS 'ID do customer no Stripe';
COMMENT ON COLUMN organizations.stripe_subscription_id IS 'ID da subscription ativa no Stripe';
COMMENT ON COLUMN organizations.subscription_status IS 'Status da subscription: active, past_due, canceled, etc';
COMMENT ON COLUMN organizations.current_period_end IS 'Data de término do período atual de cobrança';
COMMENT ON COLUMN organizations.default_payment_method IS 'ID do método de pagamento padrão';

-- Atualizar plano padrão de 'starter' para 'basic' (se necessário)
-- UPDATE organizations SET plan = 'basic' WHERE plan = 'starter' AND stripe_subscription_id IS NULL;

