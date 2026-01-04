-- Remover coluna daily_limit das organizações
ALTER TABLE organizations DROP COLUMN IF EXISTS daily_limit;

-- Desativar chaves de organizações no plano basic
UPDATE api_keys
SET is_active = FALSE
WHERE organization_id IN (
    SELECT id FROM organizations WHERE plan = 'basic'
);


