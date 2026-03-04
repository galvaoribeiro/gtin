"""
Cria índices GIN funcionais para Full-Text Search por coluna.
=============================================================

Cria índices sobre to_tsvector('simple', ...) em brand e product_name
separadamente. Não precisa de coluna extra (search_vector).

Uso:
    python scripts/create_fts_indexes.py
"""

from __future__ import annotations

import sys
import time
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.db.session import engine  # noqa: E402

INDEXES = [
    (
        "idx_products_brand_fts",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_brand_fts "
        "ON products USING GIN(to_tsvector('simple', coalesce(brand, '')))",
    ),
    (
        "idx_products_name_fts",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_name_fts "
        "ON products USING GIN(to_tsvector('simple', coalesce(product_name, '')))",
    ),
]


def create_index(name: str, ddl: str) -> None:
    import psycopg2.extensions

    print(f"[INDEX] Criando {name} (pode levar vários minutos em tabelas grandes)...")
    t0 = time.time()

    raw_conn = engine.raw_connection()
    try:
        raw_conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = raw_conn.cursor()
        cursor.execute(ddl)
        cursor.close()
    finally:
        raw_conn.close()

    elapsed = time.time() - t0
    print(f"[INDEX] {name} criado em {elapsed:.1f}s")


def main() -> None:
    for name, ddl in INDEXES:
        create_index(name, ddl)

    print("[DONE] Índices FTS por coluna criados com sucesso.")


if __name__ == "__main__":
    main()
