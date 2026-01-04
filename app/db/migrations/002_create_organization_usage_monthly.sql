-- Cria tabela para controle de uso mensal por organização
CREATE TABLE IF NOT EXISTS organization_usage_monthly (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    usage_month DATE NOT NULL,
    success_count INTEGER NOT NULL DEFAULT 0,
    error_count INTEGER NOT NULL DEFAULT 0,
    UNIQUE (organization_id, usage_month)
);

CREATE INDEX IF NOT EXISTS idx_org_usage_monthly_org ON organization_usage_monthly (organization_id);
CREATE INDEX IF NOT EXISTS idx_org_usage_monthly_month ON organization_usage_monthly (usage_month);

