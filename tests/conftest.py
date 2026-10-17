"""Fixtures para testes da API (SQLite em memória, sem Postgres)."""

from datetime import datetime

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.v1.admin_signups import router as admin_signups_router
from app.core.config import settings
from app.db.models import Organization, User
from app.db.session import get_db


@pytest.fixture
def db_engine():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Organization.__table__.create(bind=engine)
    User.__table__.create(bind=engine)
    yield engine
    engine.dispose()


@pytest.fixture
def db_session(db_engine):
    Session = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def seed_signups(db_session):
    older_org = Organization(
        name="Org Antiga",
        plan="starter",
        subscription_status="active",
        created_at=datetime(2026, 1, 1, 12, 0, 0),
    )
    newer_org = Organization(
        name="Org Nova",
        plan="basic",
        subscription_status=None,
        created_at=datetime(2026, 10, 16, 15, 0, 0),
    )
    db_session.add_all([older_org, newer_org])
    db_session.flush()

    older_user = User(
        email="antigo@example.com",
        hashed_password="hash-secreto-nao-expor",
        organization_id=older_org.id,
        role="user",
        is_active=True,
        created_at=datetime(2026, 1, 1, 12, 5, 0),
        password_reset_token_hash="reset-hash-secreto",
    )
    newer_user = User(
        email="novo@example.com",
        hashed_password="outro-hash-secreto",
        organization_id=newer_org.id,
        role="user",
        is_active=True,
        created_at=datetime(2026, 10, 16, 15, 1, 0),
    )
    db_session.add_all([older_user, newer_user])
    db_session.commit()
    return {
        "older_org": older_org,
        "newer_org": newer_org,
        "older_user": older_user,
        "newer_user": newer_user,
    }


@pytest.fixture
def client(db_session, seed_signups):
    app = FastAPI()
    app.include_router(admin_signups_router)

    def _override_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_db
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def readonly_token(monkeypatch):
    token = "test-admin-readonly-token-32chars!!"
    monkeypatch.setattr(settings, "ADMIN_READONLY_TOKEN", token)
    return token


@pytest.fixture
def disabled_readonly(monkeypatch):
    monkeypatch.setattr(settings, "ADMIN_READONLY_TOKEN", "")
