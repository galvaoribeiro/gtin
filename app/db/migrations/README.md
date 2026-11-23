# Migrações de Banco de Dados

Este diretório contém as migrações SQL para o banco de dados PostgreSQL.

## Como aplicar migrações

### Opção 1: Manualmente via psql

```bash
psql -h localhost -U seu_usuario -d gtin_db -f app/db/migrations/001_add_stripe_fields.sql
```

### Opção 2: Via Python

```python
from app.db.session import engine

with engine.connect() as conn:
    with open("app/db/migrations/001_add_stripe_fields.sql", "r") as f:
        sql = f.read()
        conn.execute(sql)
        conn.commit()
```

## Ordem de execução

1. `001_add_stripe_fields.sql` - Adiciona campos Stripe à tabela organizations
9. `009_raise_basic_monthly_limit.sql` - Zera overrides antigos do plano básico gratuito para aplicar 100 consultas/mês
10. `010_add_signup_and_api_key_ip.sql` - IP no cadastro (`users.signup_ip`) e na criação de API key (`api_keys.created_ip`)
11. `011_rename_free_plan_slug.sql` - Renomeia o plano gratuito histórico (`basic` sem Stripe) para `free`; o slug `basic` fica o plano pago

## Notas

- Sempre faça backup do banco antes de aplicar migrações em produção
- As migrações são idempotentes (podem ser executadas múltiplas vezes)
- Após aplicar, verifique se os índices foram criados corretamente

