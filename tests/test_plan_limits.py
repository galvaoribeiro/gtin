"""Limites mensais: Free (100), Basic pago (1.000) e planos superiores."""

from app.db.models import (
    FREE_PLAN,
    Organization,
    PAID_PLANS,
    PLAN_MONTHLY_LIMITS,
    clear_stale_free_monthly_overrides,
)


PAID_PLAN_MONTHLY_LIMITS = {
    "basic": 1000,
    "starter": 5000,
    "pro": 20000,
    "advanced": 100000,
    "enterprise": 20000,
}


def test_free_plan_monthly_limit_is_100():
    org = Organization(name="Gratis", plan=FREE_PLAN)
    assert PLAN_MONTHLY_LIMITS[FREE_PLAN] == 100
    assert org.get_monthly_limit_by_plan() == 100
    assert org.monthly_limit == 100
    assert org.has_paid_entitlement is False
    assert org.effective_plan == FREE_PLAN
    assert org.batch_limit == 0


def test_legacy_unsubscribed_basic_is_treated_as_free():
    org = Organization(name="Dev Organization", plan="basic")
    assert org.is_legacy_free_basic is True
    assert org.has_paid_plan_column is False
    assert org.has_paid_entitlement is False
    assert org.effective_plan == FREE_PLAN
    assert org.monthly_limit == 100
    assert org.batch_limit == 0
    assert org.api_key_active_limit == 1


def test_paid_basic_monthly_limit_is_1000():
    org = Organization(name="Basic pago", plan="basic", subscription_status="active")
    assert PLAN_MONTHLY_LIMITS["basic"] == 1000
    assert "basic" in PAID_PLANS
    assert org.is_legacy_free_basic is False
    assert org.has_paid_entitlement is True
    assert org.effective_plan == "basic"
    assert org.monthly_limit == 1000
    assert org.batch_limit == 0


def test_paid_plan_monthly_limits_unchanged():
    for plan, expected in PAID_PLAN_MONTHLY_LIMITS.items():
        org = Organization(name=f"Org {plan}", plan=plan, subscription_status="active")
        assert PLAN_MONTHLY_LIMITS[plan] == expected
        assert org.get_monthly_limit_by_plan() == expected
        assert org.monthly_limit == expected


def test_paid_quota_requires_entitled_subscription_status():
    leftover_incomplete = Organization(
        name="Checkout incompleto",
        plan="starter",
        subscription_status="incomplete",
        monthly_limit_override=5000,
    )
    assert leftover_incomplete.has_paid_entitlement is False
    assert leftover_incomplete.effective_plan == FREE_PLAN
    assert leftover_incomplete.monthly_limit == PLAN_MONTHLY_LIMITS[FREE_PLAN]
    assert leftover_incomplete.batch_limit == 0

    expired = Organization(
        name="Incomplete expired",
        plan="starter",
        subscription_status="incomplete_expired",
    )
    assert expired.monthly_limit == PLAN_MONTHLY_LIMITS[FREE_PLAN]

    active = Organization(name="Coliseu", plan="starter", subscription_status="active")
    trialing = Organization(name="Trial", plan="pro", subscription_status="trialing")
    grace = Organization(name="Renovacao", plan="advanced", subscription_status="past_due")
    scheduled_cancel = Organization(
        name="Deak Sistemas",
        plan="pro",
        subscription_status="active",
        cancel_at_period_end=True,
    )
    admin_assigned = Organization(name="Enterprise admin", plan="enterprise")

    assert active.monthly_limit == 5000
    assert trialing.monthly_limit == 20000
    assert grace.monthly_limit == 100000
    assert scheduled_cancel.monthly_limit == 20000
    assert admin_assigned.monthly_limit == 20000


def test_incomplete_basic_checkout_does_not_grant_paid_quota():
    org = Organization(
        name="Checkout basic",
        plan="basic",
        subscription_status="incomplete",
        stripe_subscription_id="sub_incomplete",
    )
    assert org.is_legacy_free_basic is False
    assert org.has_paid_entitlement is False
    assert org.monthly_limit == PLAN_MONTHLY_LIMITS[FREE_PLAN]


def test_monthly_limit_override_takes_precedence():
    org = Organization(name="Custom", plan=FREE_PLAN, monthly_limit_override=10)
    assert org.get_monthly_limit_by_plan() == 100
    assert org.monthly_limit == 10


def test_clear_stale_free_overrides_does_not_touch_paid_or_higher(db_engine, db_session):
    stale_free = Organization(
        name="Free antigo",
        plan=FREE_PLAN,
        monthly_limit_override=5,
    )
    already_ok_free = Organization(
        name="Free custom alto",
        plan=FREE_PLAN,
        monthly_limit_override=250,
    )
    null_free = Organization(
        name="Free sem override",
        plan=FREE_PLAN,
        monthly_limit_override=None,
    )
    paid_with_override = Organization(
        name="Starter custom",
        plan="starter",
        monthly_limit_override=5,
    )
    paid_basic = Organization(
        name="Basic pago custom",
        plan="basic",
        subscription_status="active",
        monthly_limit_override=5,
    )
    db_session.add_all(
        [stale_free, already_ok_free, null_free, paid_with_override, paid_basic]
    )
    db_session.commit()

    updated = clear_stale_free_monthly_overrides(db_engine)
    assert updated == 1

    db_session.expire_all()
    assert stale_free.monthly_limit_override is None
    assert stale_free.monthly_limit == 100
    assert already_ok_free.monthly_limit_override == 250
    assert already_ok_free.monthly_limit == 250
    assert null_free.monthly_limit_override is None
    assert null_free.monthly_limit == 100
    assert paid_with_override.monthly_limit_override == 5
    assert paid_with_override.monthly_limit == 5
    assert paid_basic.monthly_limit_override == 5
    assert paid_basic.monthly_limit == 5


def test_clear_stale_free_overrides_is_idempotent(db_engine, db_session):
    org = Organization(name="Free", plan=FREE_PLAN, monthly_limit_override=5)
    db_session.add(org)
    db_session.commit()

    assert clear_stale_free_monthly_overrides(db_engine) == 1
    assert clear_stale_free_monthly_overrides(db_engine) == 0
    db_session.refresh(org)
    assert org.monthly_limit == 100
