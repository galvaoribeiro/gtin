"""IP persistido só no cadastro e na criação de API key (não em lookups)."""

from starlette.requests import Request
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.pool import StaticPool

from app.core.rate_limit import get_client_ip, get_stored_client_ip
from app.db.models import ApiKey, Organization, User, ensure_client_ip_columns


def _request(headers=None, client_host="127.0.0.1"):
    header_list = [
        (key.lower().encode("latin-1"), value.encode("latin-1"))
        for key, value in (headers or {}).items()
    ]
    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": "GET",
        "scheme": "http",
        "path": "/",
        "raw_path": b"/",
        "query_string": b"",
        "headers": header_list,
        "client": (client_host, 123) if client_host else None,
        "server": ("test", 80),
    }
    return Request(scope)


def test_get_client_ip_prefers_x_real_ip():
    request = _request(
        {
            "X-Real-IP": "198.51.100.9",
            "X-Forwarded-For": "203.0.113.10, 10.0.0.1",
        }
    )
    assert get_client_ip(request) == "198.51.100.9"
    assert get_stored_client_ip(request) == "198.51.100.9"


def test_get_client_ip_uses_first_x_forwarded_for_hop():
    request = _request({"X-Forwarded-For": "203.0.113.10, 10.0.0.1"})
    assert get_client_ip(request) == "203.0.113.10"
    assert get_stored_client_ip(request) == "203.0.113.10"


def test_get_client_ip_falls_back_to_client_host():
    request = _request(client_host="192.0.2.1")
    assert get_client_ip(request) == "192.0.2.1"
    assert get_stored_client_ip(request) == "192.0.2.1"


def test_stored_ip_is_null_when_unknown():
    request = _request(client_host=None)
    assert get_client_ip(request) == "unknown"
    assert get_stored_client_ip(request) is None


def test_ensure_client_ip_columns_is_idempotent_on_sqlite():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    with engine.begin() as conn:
        conn.execute(text("CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT)"))
        conn.execute(text("CREATE TABLE api_keys (id INTEGER PRIMARY KEY, name TEXT)"))

    ensure_client_ip_columns(engine)
    ensure_client_ip_columns(engine)

    inspector = inspect(engine)
    user_cols = {col["name"] for col in inspector.get_columns("users")}
    key_cols = {col["name"] for col in inspector.get_columns("api_keys")}
    assert "signup_ip" in user_cols
    assert "created_ip" in key_cols
    engine.dispose()


def _register(auth_client, email, headers=None):
    payload = {
        "email": email,
        "password": "senha-segura-1",
        "organization_name": f"Org {email}",
    }
    return auth_client.post("/v1/auth/register", json=payload, headers=headers or {})


def test_register_stores_x_forwarded_for_and_hides_it_from_response(auth_client, db_session):
    response = _register(
        auth_client,
        "com-ip@example.com",
        headers={"X-Forwarded-For": "203.0.113.10, 10.0.0.1"},
    )
    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body
    assert "signup_ip" not in body
    assert "created_ip" not in body

    user = db_session.query(User).filter(User.email == "com-ip@example.com").one()
    assert user.signup_ip == "203.0.113.10"
    org = db_session.query(Organization).filter(Organization.id == user.organization_id).one()
    assert org.plan == "free"


def test_register_without_forwarded_for_stores_client_host(auth_client, db_session):
    response = _register(auth_client, "sem-xff@example.com")
    assert response.status_code == 200
    user = db_session.query(User).filter(User.email == "sem-xff@example.com").one()
    assert user.signup_ip == "testclient"
    assert user.signup_ip != "unknown"


def test_create_api_key_stores_x_forwarded_for_and_hides_it_from_response(
    auth_client, db_session
):
    token = _register(auth_client, "chave-ip@example.com").json()["access_token"]
    response = auth_client.post(
        "/v1/dashboard/api-keys",
        json={"name": "Chave com IP"},
        headers={
            "Authorization": f"Bearer {token}",
            "X-Forwarded-For": "198.51.100.20",
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert "key" in body
    assert "created_ip" not in body
    assert "signup_ip" not in body

    api_key = db_session.query(ApiKey).filter(ApiKey.name == "Chave com IP").one()
    assert api_key.created_ip == "198.51.100.20"


def test_create_api_key_without_forwarded_for_stores_client_host(auth_client, db_session):
    token = _register(auth_client, "chave-sem-xff@example.com").json()["access_token"]
    response = auth_client.post(
        "/v1/dashboard/api-keys",
        json={"name": "Chave sem XFF"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201
    api_key = db_session.query(ApiKey).filter(ApiKey.name == "Chave sem XFF").one()
    assert api_key.created_ip == "testclient"
    assert api_key.created_ip != "unknown"


def test_admin_signups_returns_signup_ip_not_key_ip(
    auth_client, db_session, readonly_token
):
    _register(
        auth_client,
        "admin-ip@example.com",
        headers={"X-Forwarded-For": "192.0.2.55"},
    )
    saved = (
        db_session.query(User)
        .filter(User.email == "admin-ip@example.com")
        .one()
    )
    assert saved.signup_ip == "192.0.2.55"

    response = auth_client.get(
        "/api/admin/signups",
        headers={"Authorization": f"Bearer {readonly_token}"},
    )
    assert response.status_code == 200
    body = response.json()
    user = next(item for item in body["users"] if item["email"] == "admin-ip@example.com")
    assert user["signup_ip"] == "192.0.2.55"
    assert "created_ip" not in user

    org = next(item for item in body["organizations"] if item["name"] == "Org admin-ip@example.com")
    assert "signup_ip" not in org
    assert "created_ip" not in org
