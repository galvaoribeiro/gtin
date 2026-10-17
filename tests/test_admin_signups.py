from app.core.security import tokens_match


SIGNUPS_PATH = "/api/admin/signups"
SECRET_MARKERS = (
    "hashed_password",
    "hash-secreto",
    "password_reset",
    "reset-hash-secreto",
    "stripe_customer_id",
    "stripe_subscription_id",
    "default_payment_method",
    "JWT_SECRET",
)


def _json(response):
    return response.json()


def test_tokens_match_is_constant_time_and_rejects_mismatch():
    assert tokens_match("abc", "abc") is True
    assert tokens_match("abc", "xyz") is False
    assert tokens_match("short", "muito-maior") is False


def test_signups_disabled_when_token_unset(client, disabled_readonly):
    response = client.get(
        SIGNUPS_PATH,
        headers={"Authorization": "Bearer qualquer-coisa"},
    )
    assert response.status_code == 503
    assert "desabilitada" in _json(response)["detail"].lower()


def test_signups_401_without_authorization(client, readonly_token):
    response = client.get(SIGNUPS_PATH)
    assert response.status_code == 401
    assert _json(response)["detail"] == "Não autenticado"


def test_signups_401_with_wrong_token(client, readonly_token):
    response = client.get(
        SIGNUPS_PATH,
        headers={"Authorization": "Bearer token-errado"},
    )
    assert response.status_code == 401
    assert _json(response)["detail"] == "Não autenticado"


def test_signups_returns_data_with_valid_token(client, readonly_token, seed_signups):
    response = client.get(
        SIGNUPS_PATH,
        headers={"Authorization": f"Bearer {readonly_token}"},
    )
    assert response.status_code == 200
    body = _json(response)
    assert set(body) == {"users", "organizations"}

    user_emails = {item["email"] for item in body["users"]}
    org_names = {item["name"] for item in body["organizations"]}
    assert "novo@example.com" in user_emails
    assert "antigo@example.com" in user_emails
    assert "Org Nova" in org_names
    assert "Org Antiga" in org_names

    newer_user = next(item for item in body["users"] if item["email"] == "novo@example.com")
    assert newer_user["organization_id"] == seed_signups["newer_org"].id
    assert newer_user["organization_name"] == "Org Nova"
    assert newer_user["name"] == "Org Nova"
    assert newer_user["plan"] == "basic"
    assert newer_user["subscription_status"] is None
    assert "created_at" in newer_user

    newer_org = next(item for item in body["organizations"] if item["name"] == "Org Nova")
    assert seed_signups["newer_user"].id in newer_org["user_ids"]
    assert newer_org["email"] == "novo@example.com"
    assert newer_org["plan"] == "basic"

    dumped = str(body)
    for marker in SECRET_MARKERS:
        assert marker not in dumped


def test_signups_filters_by_since_id(client, readonly_token, seed_signups):
    cutoff = seed_signups["older_user"].id
    response = client.get(
        SIGNUPS_PATH,
        params={"since_id": cutoff},
        headers={"Authorization": f"Bearer {readonly_token}"},
    )
    assert response.status_code == 200
    body = _json(response)
    assert [item["email"] for item in body["users"]] == ["novo@example.com"]
    assert [item["name"] for item in body["organizations"]] == ["Org Nova"]


def test_signups_filters_by_since_date(client, readonly_token):
    response = client.get(
        SIGNUPS_PATH,
        params={"since": "2026-10-01T00:00:00Z"},
        headers={"Authorization": f"Bearer {readonly_token}"},
    )
    assert response.status_code == 200
    body = _json(response)
    assert [item["email"] for item in body["users"]] == ["novo@example.com"]
    assert [item["name"] for item in body["organizations"]] == ["Org Nova"]


def test_signups_rejects_invalid_since(client, readonly_token):
    response = client.get(
        SIGNUPS_PATH,
        params={"since": "ontem"},
        headers={"Authorization": f"Bearer {readonly_token}"},
    )
    assert response.status_code == 400


def test_signups_is_get_only(client, readonly_token):
    response = client.post(
        SIGNUPS_PATH,
        headers={"Authorization": f"Bearer {readonly_token}"},
    )
    assert response.status_code == 405
