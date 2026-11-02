"""Billing: plano e cotas só sobem com assinatura paga de fato."""

from datetime import datetime

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.deps import get_db
from app.api.v1.billing import (
    _apply_subscription_to_org,
    _invoice_subscription_id,
    router as billing_router,
)
from app.db.models import PLAN_MONTHLY_LIMITS, Organization
from app.services.stripe_service import StripeService


WEBHOOK_PATH = "/api/v1/billing/webhook"


def _sub_data(**overrides):
    data = {
        "stripe_subscription_id": "sub_test",
        "subscription_status": "incomplete",
        "current_period_end": datetime(2026, 12, 1, 12, 0, 0),
        "default_payment_method": None,
        "cancel_at_period_end": False,
        "plan": "starter",
        "metadata": {},
        "price_id": "price_starter",
        "price_unit_amount": 4900,
    }
    data.update(overrides)
    return data


def _stripe_subscription(
    status,
    plan="starter",
    sub_id="sub_test",
    customer="cus_test",
    cancel_at_period_end=False,
):
    return {
        "id": sub_id,
        "customer": customer,
        "status": status,
        "current_period_end": 1790000000,
        "default_payment_method": None,
        "cancel_at_period_end": cancel_at_period_end,
        "metadata": {"plan": plan, "organization_id": "1"},
        "items": {"data": [{"price": {"id": f"price_{plan}", "metadata": {"gtin_plan": plan}}}]},
    }


@pytest.fixture
def billing_client(db_session):
    app = FastAPI()
    app.include_router(billing_router)

    def _override_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_db
    with TestClient(app) as test_client:
        yield test_client


def _post_webhook(client, monkeypatch, event, subscription=None):
    monkeypatch.setattr(
        StripeService,
        "parse_webhook_event",
        staticmethod(lambda payload, signature: event),
    )
    monkeypatch.setattr(
        StripeService,
        "get_subscription",
        staticmethod(lambda subscription_id: subscription),
    )
    return client.post(
        WEBHOOK_PATH,
        content=b"{}",
        headers={"stripe-signature": "t=test"},
    )


def _make_org(db_session, **kwargs):
    values = {
        "name": "Org teste",
        "plan": "basic",
        "stripe_customer_id": "cus_test",
    }
    values.update(kwargs)
    org = Organization(**values)
    db_session.add(org)
    db_session.commit()
    db_session.refresh(org)
    return org


def test_incomplete_checkout_does_not_elevate_plan(db_session):
    org = _make_org(db_session)
    _apply_subscription_to_org(org, _sub_data(subscription_status="incomplete", plan="starter"))
    db_session.commit()
    db_session.refresh(org)

    assert org.plan == "basic"
    assert org.subscription_status == "incomplete"
    assert org.stripe_subscription_id == "sub_test"
    assert org.monthly_limit_override is None
    assert org.monthly_limit == PLAN_MONTHLY_LIMITS["basic"]


def test_active_and_trialing_elevate_plan(db_session):
    active_org = _make_org(db_session, name="Ativa", stripe_customer_id="cus_active")
    _apply_subscription_to_org(
        active_org,
        _sub_data(subscription_status="active", plan="starter", stripe_subscription_id="sub_active"),
    )

    trial_org = _make_org(db_session, name="Trial", stripe_customer_id="cus_trial")
    _apply_subscription_to_org(
        trial_org,
        _sub_data(
            subscription_status="trialing",
            plan="pro",
            stripe_subscription_id="sub_trial",
        ),
    )
    db_session.commit()

    assert active_org.plan == "starter"
    assert active_org.subscription_status == "active"
    assert active_org.monthly_limit == 5000

    assert trial_org.plan == "pro"
    assert trial_org.subscription_status == "trialing"
    assert trial_org.monthly_limit == 20000


def test_scheduled_cancel_active_keeps_paid_plan(db_session):
    org = _make_org(
        db_session,
        name="Deak Sistemas",
        plan="pro",
        subscription_status="active",
        stripe_customer_id="cus_deak",
        stripe_subscription_id="sub_deak",
        cancel_at_period_end=True,
    )
    _apply_subscription_to_org(
        org,
        _sub_data(
            stripe_subscription_id="sub_deak",
            subscription_status="active",
            plan="pro",
            cancel_at_period_end=True,
        ),
    )
    db_session.commit()

    assert org.plan == "pro"
    assert org.subscription_status == "active"
    assert org.cancel_at_period_end is True
    assert org.monthly_limit == 20000


def test_past_due_renewal_does_not_downgrade_paid_org(db_session):
    org = _make_org(
        db_session,
        name="Ja pagava",
        plan="starter",
        subscription_status="active",
        stripe_customer_id="cus_paid",
        stripe_subscription_id="sub_paid",
    )
    _apply_subscription_to_org(
        org,
        _sub_data(
            stripe_subscription_id="sub_paid",
            subscription_status="past_due",
            plan="starter",
        ),
    )
    db_session.commit()

    assert org.plan == "starter"
    assert org.subscription_status == "past_due"
    assert org.monthly_limit == 5000


def test_past_due_does_not_elevate_from_basic(db_session):
    org = _make_org(db_session)
    _apply_subscription_to_org(org, _sub_data(subscription_status="past_due", plan="starter"))
    db_session.commit()

    assert org.plan == "basic"
    assert org.subscription_status == "past_due"
    assert org.monthly_limit == PLAN_MONTHLY_LIMITS["basic"]


def test_incomplete_expired_reverts_to_basic_and_clears_overrides(db_session):
    org = _make_org(
        db_session,
        plan="starter",
        subscription_status="incomplete",
        stripe_subscription_id="sub_exp",
        monthly_limit_override=5000,
        batch_limit_override=5,
        enterprise_price_id="price_ent",
        enterprise_amount_cents=9900,
    )
    _apply_subscription_to_org(
        org,
        _sub_data(
            stripe_subscription_id="sub_exp",
            subscription_status="incomplete_expired",
            plan="starter",
        ),
    )
    db_session.commit()

    assert org.plan == "basic"
    assert org.subscription_status == "incomplete_expired"
    assert org.monthly_limit_override is None
    assert org.batch_limit_override is None
    assert org.enterprise_price_id is None
    assert org.enterprise_amount_cents is None
    assert org.monthly_limit == PLAN_MONTHLY_LIMITS["basic"]


@pytest.mark.parametrize("status", ["canceled", "unpaid"])
def test_canceled_and_unpaid_revert_to_basic(db_session, status):
    org = _make_org(
        db_session,
        plan="pro",
        subscription_status="active",
        stripe_customer_id=f"cus_{status}",
        stripe_subscription_id=f"sub_{status}",
        monthly_limit_override=999,
    )
    _apply_subscription_to_org(
        org,
        _sub_data(
            stripe_subscription_id=f"sub_{status}",
            subscription_status=status,
            plan="pro",
        ),
    )
    db_session.commit()

    assert org.plan == "basic"
    assert org.subscription_status == status
    assert org.monthly_limit_override is None


def test_webhook_subscription_created_incomplete_does_not_elevate(
    billing_client, db_session, monkeypatch
):
    org = _make_org(db_session, stripe_customer_id="cus_wh_inc")
    subscription = _stripe_subscription("incomplete", sub_id="sub_wh_inc", customer="cus_wh_inc")
    subscription["metadata"]["organization_id"] = str(org.id)
    event = {
        "type": "customer.subscription.created",
        "data": {"object": subscription},
    }

    response = _post_webhook(billing_client, monkeypatch, event, subscription=subscription)
    assert response.status_code == 200

    db_session.refresh(org)
    assert org.plan == "basic"
    assert org.subscription_status == "incomplete"


def test_webhook_incomplete_expired_updated_reverts_to_basic(
    billing_client, db_session, monkeypatch
):
    org = _make_org(
        db_session,
        plan="starter",
        subscription_status="incomplete",
        stripe_customer_id="cus_wh_exp",
        stripe_subscription_id="sub_wh_exp",
    )
    subscription = _stripe_subscription(
        "incomplete_expired", sub_id="sub_wh_exp", customer="cus_wh_exp"
    )
    subscription["metadata"]["organization_id"] = str(org.id)
    event = {
        "type": "customer.subscription.updated",
        "data": {"object": subscription},
    }

    response = _post_webhook(billing_client, monkeypatch, event, subscription=subscription)
    assert response.status_code == 200

    db_session.refresh(org)
    assert org.plan == "basic"
    assert org.subscription_status == "incomplete_expired"


def test_webhook_payment_failed_first_invoice_keeps_incomplete(
    billing_client, db_session, monkeypatch
):
    org = _make_org(
        db_session,
        stripe_customer_id="cus_fail",
        stripe_subscription_id="sub_fail",
        subscription_status="incomplete",
    )
    subscription = _stripe_subscription("incomplete", sub_id="sub_fail", customer="cus_fail")
    event = {
        "type": "invoice.payment_failed",
        "data": {
            "object": {
                "customer": "cus_fail",
                "subscription": "sub_fail",
            }
        },
    }

    response = _post_webhook(billing_client, monkeypatch, event, subscription=subscription)
    assert response.status_code == 200

    db_session.refresh(org)
    assert org.subscription_status == "incomplete"
    assert org.plan == "basic"
    assert org.monthly_limit == PLAN_MONTHLY_LIMITS["basic"]


def test_webhook_payment_failed_renewal_past_due_keeps_paid_plan(
    billing_client, db_session, monkeypatch
):
    org = _make_org(
        db_session,
        name="Renovacao",
        plan="starter",
        subscription_status="active",
        stripe_customer_id="cus_renew",
        stripe_subscription_id="sub_renew",
    )
    subscription = _stripe_subscription("past_due", sub_id="sub_renew", customer="cus_renew")
    event = {
        "type": "invoice.payment_failed",
        "data": {
            "object": {
                "customer": "cus_renew",
                "parent": {"subscription_details": {"subscription": "sub_renew"}},
            }
        },
    }

    response = _post_webhook(billing_client, monkeypatch, event, subscription=subscription)
    assert response.status_code == 200

    db_session.refresh(org)
    assert org.subscription_status == "past_due"
    assert org.plan == "starter"
    assert org.monthly_limit == 5000


def test_webhook_payment_failed_without_subscription_does_not_force_past_due(
    billing_client, db_session, monkeypatch
):
    org = _make_org(
        db_session,
        stripe_customer_id="cus_nosub",
        subscription_status="incomplete",
    )
    event = {
        "type": "invoice.payment_failed",
        "data": {"object": {"customer": "cus_nosub"}},
    }

    response = _post_webhook(billing_client, monkeypatch, event, subscription=None)
    assert response.status_code == 200

    db_session.refresh(org)
    assert org.subscription_status == "incomplete"
    assert org.plan == "basic"


def test_webhook_subscription_deleted_reverts_to_basic(
    billing_client, db_session, monkeypatch
):
    org = _make_org(
        db_session,
        plan="pro",
        subscription_status="active",
        stripe_customer_id="cus_del",
        stripe_subscription_id="sub_del",
        cancel_at_period_end=True,
        monthly_limit_override=123,
        batch_limit_override=9,
        enterprise_price_id="price_ent",
        enterprise_amount_cents=15000,
    )
    event = {
        "type": "customer.subscription.deleted",
        "data": {
            "object": {
                "id": "sub_del",
                "status": "canceled",
                "customer": "cus_del",
            }
        },
    }

    response = _post_webhook(billing_client, monkeypatch, event, subscription=None)
    assert response.status_code == 200

    db_session.refresh(org)
    assert org.plan == "basic"
    assert org.subscription_status == "canceled"
    assert org.stripe_subscription_id is None
    assert org.cancel_at_period_end is False
    assert org.monthly_limit_override is None
    assert org.batch_limit_override is None
    assert org.enterprise_price_id is None
    assert org.enterprise_amount_cents is None


def test_webhook_deleted_incomplete_expired_still_reverts_to_basic(
    billing_client, db_session, monkeypatch
):
    org = _make_org(
        db_session,
        plan="starter",
        subscription_status="incomplete_expired",
        stripe_customer_id="cus_del_exp",
        stripe_subscription_id="sub_del_exp",
    )
    event = {
        "type": "customer.subscription.deleted",
        "data": {
            "object": {
                "id": "sub_del_exp",
                "status": "incomplete_expired",
                "customer": "cus_del_exp",
            }
        },
    }

    response = _post_webhook(billing_client, monkeypatch, event, subscription=None)
    assert response.status_code == 200

    db_session.refresh(org)
    assert org.plan == "basic"
    assert org.subscription_status == "canceled"
    assert org.stripe_subscription_id is None


def test_checkout_completed_incomplete_does_not_elevate(
    billing_client, db_session, monkeypatch
):
    org = _make_org(db_session, stripe_customer_id="cus_chk")
    subscription = _stripe_subscription("incomplete", sub_id="sub_chk", customer="cus_chk")
    event = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "customer": "cus_chk",
                "subscription": "sub_chk",
                "metadata": {"organization_id": str(org.id)},
            }
        },
    }

    response = _post_webhook(billing_client, monkeypatch, event, subscription=subscription)
    assert response.status_code == 200

    db_session.refresh(org)
    assert org.plan == "basic"
    assert org.subscription_status == "incomplete"


def test_current_paying_orgs_are_not_regressed():
    """Coliseu/SaudeC/MERCEARIA (active) e Deak (pro + cancel agendado)."""
    coliseu = Organization(name="Coliseu", plan="starter", subscription_status="active")
    saudec = Organization(name="SaudeC", plan="starter", subscription_status="active")
    mercearia = Organization(
        name="MERCEARIA DA SEDE", plan="starter", subscription_status="active"
    )
    deak = Organization(
        name="Deak Sistemas",
        plan="pro",
        subscription_status="active",
        cancel_at_period_end=True,
    )

    for org in (coliseu, saudec, mercearia):
        assert org.has_paid_entitlement is True
        assert org.monthly_limit == 5000
        assert org.batch_limit == 5

    assert deak.has_paid_entitlement is True
    assert deak.monthly_limit == 20000
    assert deak.batch_limit == 10


def test_invoice_subscription_id_reads_classic_and_parent_shapes():
    assert _invoice_subscription_id({"subscription": "sub_a"}) == "sub_a"
    assert _invoice_subscription_id({"subscription": {"id": "sub_b"}}) == "sub_b"
    assert (
        _invoice_subscription_id(
            {"parent": {"subscription_details": {"subscription": "sub_c"}}}
        )
        == "sub_c"
    )
    assert _invoice_subscription_id({"customer": "cus_x"}) is None
