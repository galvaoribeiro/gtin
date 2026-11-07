"""Limites de GTINs por lote e execução síncrona dos endpoints de lookup."""

import inspect
from types import SimpleNamespace

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy import text
from sqlalchemy.orm import sessionmaker

from app.api.deps import ApiKeyAuth
from app.api.v1 import gtins as gtins_module
from app.core import rate_limit
from app.db.models import HARD_MAX_BATCH_SIZE, MAX_BATCH_SIZE, Organization
from app.db.session import get_db
from app.schemas.admin import AdminEnterpriseUpgradeLinkRequest, AdminOrganizationUpdate
from app.schemas.product import BatchRequest


# ---------------------------------------------------------------------------
# Limites por organização
# ---------------------------------------------------------------------------

def test_default_plan_batch_limits_unchanged():
    expected = {"starter": 5, "pro": 10, "advanced": 20, "enterprise": 100}
    for plan, limit in expected.items():
        org = Organization(name=f"Org {plan}", plan=plan, subscription_status="active")
        assert org.batch_limit == limit
    assert MAX_BATCH_SIZE == 100


def test_hard_max_is_above_default_max():
    assert HARD_MAX_BATCH_SIZE > MAX_BATCH_SIZE


def test_batch_override_can_exceed_default_max():
    org = Organization(name="Interno", plan="enterprise", batch_limit_override=HARD_MAX_BATCH_SIZE)
    assert org.batch_limit == HARD_MAX_BATCH_SIZE


def test_batch_request_schema_accepts_up_to_hard_max():
    BatchRequest(gtins=["7891000100103"] * HARD_MAX_BATCH_SIZE)
    with pytest.raises(ValidationError):
        BatchRequest(gtins=["7891000100103"] * (HARD_MAX_BATCH_SIZE + 1))


def test_admin_override_cannot_exceed_hard_max():
    AdminOrganizationUpdate(batch_limit_override=HARD_MAX_BATCH_SIZE)
    with pytest.raises(ValidationError):
        AdminOrganizationUpdate(batch_limit_override=HARD_MAX_BATCH_SIZE + 1)
    with pytest.raises(ValidationError):
        AdminEnterpriseUpgradeLinkRequest(amount_cents=1000, batch_limit_override=HARD_MAX_BATCH_SIZE + 1)


# ---------------------------------------------------------------------------
# Endpoints síncronos: SQLAlchemy e Redis são bloqueantes e não podem rodar
# dentro do event loop (com async def, cada worker atende uma requisição por vez).
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    "func",
    [
        gtins_module.get_products_batch,
        gtins_module.get_products_batch_query,
        gtins_module.get_product_by_gtin,
        rate_limit.rate_limit_lookup,
        rate_limit.rate_limit_search,
    ],
)
def test_lookup_handlers_and_dependencies_are_sync(func):
    assert not inspect.iscoroutinefunction(func)


# ---------------------------------------------------------------------------
# POST /v1/gtins/batch com limite da organização
# ---------------------------------------------------------------------------

@pytest.fixture
def products_session(db_engine):
    with db_engine.begin() as conn:
        conn.execute(text(
            """
            CREATE TABLE products (
                gtin TEXT PRIMARY KEY, gtin_type INTEGER, brand TEXT, product_name TEXT,
                origin_country TEXT, ncm TEXT, cest TEXT,
                gross_weight_value TEXT, gross_weight_unit TEXT
            )
            """
        ))
        conn.execute(text(
            "INSERT INTO products (gtin, gtin_type, brand, product_name, origin_country, ncm, cest) "
            "VALUES ('7891000100103', 13, 'MOCA', 'MOÇA Leite Condensado Lata 395g', 'Brasil', '04029900', NULL)"
        ))
    Session = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()


def _client_for(org, products_session, monkeypatch):
    monkeypatch.setattr(gtins_module, "get_organization_monthly_usage", lambda db, org_id: 0)
    monkeypatch.setattr(gtins_module, "record_org_usage_monthly", lambda *a, **k: None)
    monkeypatch.setattr(gtins_module, "record_api_usage", lambda *a, **k: None)

    app = FastAPI()
    app.include_router(gtins_module.router)
    app.dependency_overrides[rate_limit.rate_limit_lookup] = lambda: ApiKeyAuth(
        organization=org, api_key=SimpleNamespace(id=1)
    )

    def _get_db():
        yield products_session

    app.dependency_overrides[get_db] = _get_db
    return TestClient(app)


def _gtins(n):
    return ["7891000100103"] + [f"789{i:010d}" for i in range(n - 1)]


def test_batch_with_override_accepts_more_than_default_max(products_session, monkeypatch):
    org = Organization(id=1, name="Interno", plan="enterprise", batch_limit_override=HARD_MAX_BATCH_SIZE)
    client = _client_for(org, products_session, monkeypatch)

    resp = client.post("/v1/gtins/batch", json={"gtins": _gtins(HARD_MAX_BATCH_SIZE)})

    assert resp.status_code == 200
    body = resp.json()
    assert body["total_requested"] == HARD_MAX_BATCH_SIZE
    assert body["total_found"] == 1
    assert body["results"][0]["product"]["brand"] == "MOCA"


def test_enterprise_without_override_still_capped_at_default_max(products_session, monkeypatch):
    org = Organization(id=1, name="Enterprise", plan="enterprise")
    client = _client_for(org, products_session, monkeypatch)

    assert client.post("/v1/gtins/batch", json={"gtins": _gtins(MAX_BATCH_SIZE)}).status_code == 200
    resp = client.post("/v1/gtins/batch", json={"gtins": _gtins(MAX_BATCH_SIZE + 1)})
    assert resp.status_code == 400
    assert f"máximo de {MAX_BATCH_SIZE} GTINs" in resp.json()["detail"]


def test_batch_above_hard_max_is_rejected(products_session, monkeypatch):
    org = Organization(id=1, name="Interno", plan="enterprise", batch_limit_override=HARD_MAX_BATCH_SIZE)
    client = _client_for(org, products_session, monkeypatch)

    resp = client.post("/v1/gtins/batch", json={"gtins": _gtins(HARD_MAX_BATCH_SIZE + 1)})
    assert resp.status_code == 422
