"""
Busca de produtos por nome e marca (PostgreSQL Full-Text Search).
=================================================================
Usa os índices GIN funcionais `idx_products_name_fts` e `idx_products_brand_fts`.
As expressões `to_tsvector('simple', coalesce(col, ''))` precisam ser idênticas
às dos índices para que o planejador consiga usá-los.

Regras de custo (tabela com ~100 milhões de linhas):
- sem ORDER BY / ts_rank (exigiria pontuar todos os resultados);
- sem COUNT(*); `has_more` é obtido com LIMIT + 1;
- statement_timeout curto como rede de proteção.
"""

from __future__ import annotations

import re

from psycopg2.errors import QueryCanceled
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from app.schemas.product import ProductResponse

SEARCH_LIMIT = 10
MAX_SEARCH_OFFSET = 40
MAX_TOKENS = 5
MIN_TOKEN_LEN = 3
MIN_PREFIX_LEN = 4
STATEMENT_TIMEOUT = "3s"

_TOKEN_RE = re.compile(r"[0-9A-Za-zÀ-ÖØ-öø-ÿ]+")


class InvalidSearchError(ValueError):
    """Parâmetros de busca inválidos (mensagem pronta para o usuário)."""


class SearchTooBroadError(Exception):
    """A consulta excedeu o statement_timeout; o usuário deve refinar a busca."""


def build_prefix_tsquery(raw: str | None) -> str | None:
    """
    Converte texto livre em uma expressão para `to_tsquery('simple', ...)`.

    Mantém apenas trechos alfanuméricos (impede injeção de sintaxe de tsquery),
    descarta palavras muito curtas (exceto números), limita a quantidade de
    palavras e aplica prefixo (`:*`) na última palavra quando ela tem
    MIN_PREFIX_LEN caracteres ou mais.

    Retorna None quando não sobra nenhuma palavra utilizável.
    """
    if not raw:
        return None

    tokens = [t.lower() for t in _TOKEN_RE.findall(raw)]
    tokens = [t for t in tokens if len(t) >= MIN_TOKEN_LEN or t.isdigit()]
    tokens = tokens[:MAX_TOKENS]
    if not tokens:
        return None

    *head, last = tokens
    if len(last) >= MIN_PREFIX_LEN:
        last = f"{last}:*"
    return " & ".join([*head, last])


def search_products(
    db: Session,
    *,
    name: str | None,
    brand: str | None,
    ncm: str | None = None,
    offset: int = 0,
) -> tuple[list[ProductResponse], bool]:
    """
    Busca até SEARCH_LIMIT produtos por nome e/ou marca (e NCM como filtro
    complementar). Retorna (itens, has_more).

    Raises:
        InvalidSearchError: filtros ausentes, sem palavras válidas ou offset acima do teto.
        SearchTooBroadError: a consulta estourou o statement_timeout.
    """
    if offset < 0 or offset > MAX_SEARCH_OFFSET:
        raise InvalidSearchError(
            "Paginação limitada aos primeiros resultados. Refine a busca com mais palavras."
        )

    where_clauses: list[str] = []
    params: dict[str, str | int] = {}

    if name:
        name_q = build_prefix_tsquery(name)
        if not name_q:
            raise InvalidSearchError(
                "Informe ao menos uma palavra com 3 ou mais caracteres no nome do produto."
            )
        where_clauses.append(
            "to_tsvector('simple', coalesce(product_name, '')) @@ to_tsquery('simple', :name_q)"
        )
        params["name_q"] = name_q

    if brand:
        brand_q = build_prefix_tsquery(brand)
        if not brand_q:
            raise InvalidSearchError(
                "Informe ao menos uma palavra com 3 ou mais caracteres na marca."
            )
        where_clauses.append(
            "to_tsvector('simple', coalesce(brand, '')) @@ to_tsquery('simple', :brand_q)"
        )
        params["brand_q"] = brand_q

    if not where_clauses:
        raise InvalidSearchError("Informe pelo menos um filtro: brand ou product_name.")

    if ncm:
        where_clauses.append("ncm = :ncm")
        params["ncm"] = ncm

    params["limit"] = SEARCH_LIMIT + 1
    params["offset"] = offset

    query = text(f"""
        SELECT
            gtin,
            gtin_type,
            brand,
            product_name,
            origin_country,
            ncm,
            cest,
            gross_weight_value,
            gross_weight_unit
        FROM products
        WHERE {" AND ".join(where_clauses)}
        LIMIT :limit OFFSET :offset
    """)

    try:
        db.execute(text("SELECT set_config('statement_timeout', :t, true)"), {"t": STATEMENT_TIMEOUT})
        rows = db.execute(query, params).fetchall()
    except OperationalError as exc:
        if isinstance(exc.orig, QueryCanceled):
            db.rollback()
            raise SearchTooBroadError("Busca muito ampla, refine os termos.") from exc
        raise

    has_more = len(rows) > SEARCH_LIMIT
    items = [
        ProductResponse(
            gtin=row.gtin,
            gtin_type=row.gtin_type,
            brand=row.brand,
            product_name=row.product_name,
            origin_country=row.origin_country,
            ncm=row.ncm,
            cest=row.cest,
            gross_weight_value=row.gross_weight_value,
            gross_weight_unit=row.gross_weight_unit,
        )
        for row in rows[:SEARCH_LIMIT]
    ]
    return items, has_more
