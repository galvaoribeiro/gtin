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

## Notas

- Sempre faça backup do banco antes de aplicar migrações em produção
- As migrações são idempotentes (podem ser executadas múltiplas vezes)
- Após aplicar, verifique se os índices foram criados corretamente

