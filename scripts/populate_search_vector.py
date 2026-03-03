"""
Popula a coluna search_vector e cria o índice GIN em products.
===============================================================

Uso:
    python scripts/populate_search_vector.py

Variáveis úteis:
    POPULATE_BATCH_SIZE=10000   (linhas por UPDATE)
"""

from __future__ import annotations

import os
import sys
import time
from pathlib import Path

from sqlalchemy import text

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.db.session import engine  # noqa: E402

BATCH_SIZE = int(os.getenv("POPULATE_BATCH_SIZE", "10000"))


def populate_batches() -> int:
    """
    Atualiza search_vector em lotes usando keyset pagination por gtin.
    Só toca linhas onde search_vector IS NULL (idempotente / retomável).
    """
    total_updated = 0
    batch_num = 0

    with engine.connect() as conn:
        while True:
            batch_num += 1
            t0 = time.time()

            result = conn.execute(
                text("""
                    WITH batch AS (
                        SELECT gtin
                        FROM products
                        WHERE search_vector IS NULL
                        LIMIT :batch_size
                    )
                    UPDATE products p
                    SET search_vector = to_tsvector(
                        'simple',
                        coalesce(p.product_name, '') || ' ' || coalesce(p.brand, '')
                    )
                    FROM batch
                    WHERE p.gtin = batch.gtin
                """),
                {"batch_size": BATCH_SIZE},
            )
            conn.commit()

            rows_affected = result.rowcount
            total_updated += rows_affected
            elapsed = time.time() - t0

            print(
                f"[POPULATE] batch={batch_num} rows={rows_affected} "
                f"total={total_updated} elapsed={elapsed:.1f}s"
            )

            if rows_affected == 0:
                break

    return total_updated


def create_gin_index() -> None:
    """
    Cria o índice GIN sobre search_vector.
    CONCURRENTLY requer estar fora de qualquer bloco de transação,
    então usamos psycopg2 ISOLATION_LEVEL_AUTOCOMMIT diretamente.
    """
    import psycopg2.extensions

    print("[INDEX] Criando índice GIN sobre search_vector (pode levar vários minutos)...")
    t0 = time.time()

    raw_conn = engine.raw_connection()
    try:
        raw_conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = raw_conn.cursor()
        cursor.execute(
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS "
            "idx_products_search_vector ON products USING GIN(search_vector)"
        )
        cursor.close()
    finally:
        raw_conn.close()

    elapsed = time.time() - t0
    print(f"[INDEX] Índice GIN criado em {elapsed:.1f}s")


def main() -> None:
    if BATCH_SIZE <= 0:
        raise ValueError("POPULATE_BATCH_SIZE deve ser maior que zero")

    print(f"[POPULATE] Iniciando com batch_size={BATCH_SIZE}")
    total = populate_batches()
    print(f"[POPULATE] Concluído. Total atualizado: {total}")

    create_gin_index()
    print("[DONE] search_vector populado e índice GIN criado.")


if __name__ == "__main__":
    main()
