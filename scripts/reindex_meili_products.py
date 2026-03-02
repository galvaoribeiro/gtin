"""
Reindexação bulk de produtos no Meilisearch.
===========================================

Uso:
    python scripts/reindex_meili_products.py

Variáveis úteis:
    REINDEX_BATCH_SIZE=5000
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Any

from sqlalchemy import text

# Garante import de `app.*` ao executar via:
# `python scripts/reindex_meili_products.py`
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.core.meilisearch_client import MeiliError, get_meili_client
from app.db.session import SessionLocal

BATCH_SIZE = int(os.getenv("REINDEX_BATCH_SIZE", "5000"))


def fetch_batch(db, last_gtin: str | None, batch_size: int) -> list[dict[str, Any]]:
    """
    Lê produtos em lotes estáveis por gtin (keyset pagination).
    """
    if last_gtin:
        query = text(
            """
            SELECT
                gtin,
                brand,
                product_name,
                ncm
            FROM products
            WHERE gtin > :last_gtin
            ORDER BY gtin ASC
            LIMIT :limit
            """
        )
        rows = db.execute(query, {"last_gtin": last_gtin, "limit": batch_size}).fetchall()
    else:
        query = text(
            """
            SELECT
                gtin,
                brand,
                product_name,
                ncm
            FROM products
            ORDER BY gtin ASC
            LIMIT :limit
            """
        )
        rows = db.execute(query, {"limit": batch_size}).fetchall()

    docs: list[dict[str, Any]] = []
    for row in rows:
        gtin = str(row.gtin).strip() if row.gtin is not None else ""
        if not gtin:
            continue

        docs.append(
            {
                "gtin": gtin,
                "brand": (row.brand or "").strip() or None,
                "product_name": (row.product_name or "").strip() or None,
                "ncm": (row.ncm or "").strip() or None,
            }
        )
    return docs


def main() -> None:
    if BATCH_SIZE <= 0:
        raise ValueError("REINDEX_BATCH_SIZE deve ser maior que zero")

    meili = get_meili_client()
    meili.ensure_products_index()

    db = SessionLocal()
    total_indexed = 0
    batch_number = 0
    last_gtin: str | None = None

    try:
        while True:
            docs = fetch_batch(db, last_gtin=last_gtin, batch_size=BATCH_SIZE)
            if not docs:
                break

            batch_number += 1
            meili.add_products_documents(docs)

            total_indexed += len(docs)
            last_gtin = docs[-1]["gtin"]

            print(
                f"[REINDEX] batch={batch_number} docs={len(docs)} "
                f"total={total_indexed} last_gtin={last_gtin}"
            )

        print(f"[REINDEX] concluído com sucesso. total_indexed={total_indexed}")
    except MeiliError as exc:
        print(f"[REINDEX] erro de Meilisearch: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
