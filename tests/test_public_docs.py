"""Documentação FastAPI (/docs, /redoc, /openapi.json) só em development."""

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import public_docs_kwargs

DOC_PATHS = ("/docs", "/redoc", "/openapi.json")


def _client(monkeypatch, environment: str) -> TestClient:
    monkeypatch.setattr(settings, "ENVIRONMENT", environment)
    app = FastAPI(**public_docs_kwargs())
    return TestClient(app)


def test_docs_enabled_in_development(monkeypatch):
    client = _client(monkeypatch, "development")
    for path in DOC_PATHS:
        response = client.get(path)
        assert response.status_code == 200, path
    schema = client.get("/openapi.json").json()
    assert "openapi" in schema


def test_docs_disabled_in_production(monkeypatch):
    client = _client(monkeypatch, "production")
    for path in DOC_PATHS:
        assert client.get(path).status_code == 404, path


def test_docs_disabled_when_environment_is_not_development(monkeypatch):
    client = _client(monkeypatch, "staging")
    for path in DOC_PATHS:
        assert client.get(path).status_code == 404, path
