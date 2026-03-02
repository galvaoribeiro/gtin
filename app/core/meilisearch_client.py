"""
Cliente mínimo para integração com Meilisearch.
===============================================
Mantém chamadas HTTP encapsuladas e simples para o backend.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import requests

from app.core.config import settings


class MeiliError(Exception):
    """Erro de comunicação ou resposta inválida do Meilisearch."""


@dataclass
class MeiliSearchResult:
    """Resultado normalizado de busca do Meilisearch."""

    gtins: list[str]
    estimated_total_hits: int | None
    has_more: bool


class MeiliClient:
    """Cliente HTTP simples para Meilisearch."""

    def __init__(
        self,
        base_url: str,
        api_key: str,
        index_uid: str,
        timeout_seconds: float = 2.5,
    ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.index_uid = index_uid
        self.timeout_seconds = timeout_seconds

    @property
    def _headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def _request(self, method: str, path: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
        url = f"{self.base_url}{path}"
        try:
            response = requests.request(
                method=method,
                url=url,
                headers=self._headers,
                json=payload,
                timeout=self.timeout_seconds,
            )

            if response.status_code >= 400:
                detail = response.text
                try:
                    error_json = response.json()
                    detail = str(
                        error_json.get("code")
                        or error_json.get("message")
                        or error_json.get("error")
                        or error_json
                    )
                except ValueError:
                    pass

                raise MeiliError(
                    f"Meilisearch retornou HTTP {response.status_code} "
                    f"em {method} {path}: {detail}"
                )

            if not response.text:
                return {}
            return response.json()
        except requests.RequestException as exc:
            raise MeiliError(f"Falha na chamada Meilisearch ({method} {path}): {exc}") from exc
        except ValueError as exc:
            raise MeiliError(f"Resposta JSON inválida do Meilisearch em {method} {path}") from exc

    def health(self) -> bool:
        """Verifica saúde do Meilisearch."""
        try:
            self._request("GET", "/health")
            return True
        except MeiliError:
            return False

    def ensure_products_index(self) -> None:
        """
        Garante índice e settings essenciais para busca.
        Opera de forma idempotente.
        """
        create_payload = {"uid": self.index_uid, "primaryKey": "gtin"}
        try:
            self._request("POST", "/indexes", create_payload)
        except MeiliError as exc:
            msg = str(exc)
            if "index_already_exists" not in msg and "HTTP 409" not in msg:
                raise

        settings_payload = {
            "searchableAttributes": ["product_name", "brand"],
            "filterableAttributes": ["ncm"],
        }
        self._request("PATCH", f"/indexes/{self.index_uid}/settings", settings_payload)

    def add_products_documents(self, documents: list[dict[str, Any]]) -> dict[str, Any]:
        """Adiciona documentos no índice de produtos."""
        return self._request("POST", f"/indexes/{self.index_uid}/documents", documents)

    def search_products(
        self,
        *,
        query: str,
        ncm_filter: str | None,
        offset: int,
        limit: int,
    ) -> MeiliSearchResult:
        """Executa busca textual no índice de produtos."""
        payload: dict[str, Any] = {
            "q": query,
            "offset": offset,
            "limit": limit + 1,  # +1 para descobrir has_more sem COUNT
            "attributesToRetrieve": ["gtin"],
        }
        if ncm_filter:
            safe_ncm = ncm_filter.replace("\\", "\\\\").replace('"', '\\"')
            payload["filter"] = f'ncm = "{safe_ncm}"'

        data = self._request("POST", f"/indexes/{self.index_uid}/search", payload)
        hits = data.get("hits", [])

        gtins: list[str] = []
        for hit in hits[:limit]:
            gtin = str(hit.get("gtin", "")).strip()
            if gtin:
                gtins.append(gtin)

        estimated_total_hits = data.get("estimatedTotalHits")
        has_more = len(hits) > limit

        return MeiliSearchResult(
            gtins=gtins,
            estimated_total_hits=estimated_total_hits if isinstance(estimated_total_hits, int) else None,
            has_more=has_more,
        )


def get_meili_client() -> MeiliClient:
    """Factory do cliente Meilisearch baseado em settings."""
    if not settings.MEILI_URL:
        raise MeiliError("MEILI_URL não configurado")
    if not settings.MEILI_INDEX_PRODUCTS:
        raise MeiliError("MEILI_INDEX_PRODUCTS não configurado")

    return MeiliClient(
        base_url=settings.MEILI_URL,
        api_key=settings.MEILI_API_KEY,
        index_uid=settings.MEILI_INDEX_PRODUCTS,
        timeout_seconds=settings.MEILI_TIMEOUT_SECONDS,
    )
