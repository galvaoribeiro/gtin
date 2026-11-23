-- Migration 011: o slug "basic" passa a ser o plano pago (1.000 consultas/mês, R$ 49,90).
-- Contas no plano gratuito histórico (basic sem assinatura Stripe paga)
-- são renomeadas para "free". Não altera cotas de quem já paga nem contadores
-- em organization_usage_monthly.
-- Idempotente. Incluída no repositório; aplicar no deploy, não no boot da API.

UPDATE organizations
SET plan = 'free'
WHERE plan = 'basic'
  AND stripe_subscription_id IS NULL
  AND (
    subscription_status IS NULL
    OR lower(btrim(subscription_status)) NOT IN ('active', 'trialing', 'past_due')
  );
