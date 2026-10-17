-- Migration 009: plano gratuito (basic) passa de 5 para 100 consultas/mês
--
-- O limite padrão vive no código (PLAN_MONTHLY_LIMITS). Este UPDATE só zera
-- monthly_limit_override em orgs basic cujo override ainda está abaixo de 100
-- (ex.: o teto antigo de 5), para o novo padrão valer imediatamente.
-- Não altera planos pagos nem contadores em organization_usage_monthly.
-- Idempotente.

UPDATE organizations
SET monthly_limit_override = NULL
WHERE plan = 'basic'
  AND monthly_limit_override IS NOT NULL
  AND monthly_limit_override < 100;
