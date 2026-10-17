"""Limite mensal do plano gratuito (basic) e limpeza de overrides antigos."""

from app.db.models import (
    Organization,
    PLAN_MONTHLY_LIMITS,
    clear_stale_basic_monthly_overrides,
)


PAID_PLAN_MONTHLY_LIMITS = {
    "starter": 5000,
    "pro": 20000,
    "advanced": 100000,
    "enterprise": 20000,
}


def test_basic_plan_monthly_limit_is_100():
    org = Organization(name="Gratis", plan="basic")
    assert PLAN_MONTHLY_LIMITS["basic"] == 100
    assert org.get_monthly_limit_by_plan() == 100
    assert org.monthly_limit == 100


def test_paid_plan_monthly_limits_unchanged():
    for plan, expected in PAID_PLAN_MONTHLY_LIMITS.items():
        org = Organization(name=f"Org {plan}", plan=plan)
        assert PLAN_MONTHLY_LIMITS[plan] == expected
        assert org.get_monthly_limit_by_plan() == expected
        assert org.monthly_limit == expected


def test_monthly_limit_override_takes_precedence():
    org = Organization(name="Custom", plan="basic", monthly_limit_override=10)
    assert org.get_monthly_limit_by_plan() == 100
    assert org.monthly_limit == 10


def test_clear_stale_basic_overrides_does_not_touch_paid_or_higher(db_engine, db_session):
    stale_basic = Organization(
        name="Basic antigo",
        plan="basic",
        monthly_limit_override=5,
    )
    already_ok_basic = Organization(
        name="Basic custom alto",
        plan="basic",
        monthly_limit_override=250,
    )
    null_basic = Organization(
        name="Basic sem override",
        plan="basic",
        monthly_limit_override=None,
    )
    paid_with_override = Organization(
        name="Starter custom",
        plan="starter",
        monthly_limit_override=5,
    )
    db_session.add_all([stale_basic, already_ok_basic, null_basic, paid_with_override])
    db_session.commit()

    updated = clear_stale_basic_monthly_overrides(db_engine)
    assert updated == 1

    db_session.expire_all()
    assert stale_basic.monthly_limit_override is None
    assert stale_basic.monthly_limit == 100
    assert already_ok_basic.monthly_limit_override == 250
    assert already_ok_basic.monthly_limit == 250
    assert null_basic.monthly_limit_override is None
    assert null_basic.monthly_limit == 100
    assert paid_with_override.monthly_limit_override == 5
    assert paid_with_override.monthly_limit == 5


def test_clear_stale_basic_overrides_is_idempotent(db_engine, db_session):
    org = Organization(name="Basic", plan="basic", monthly_limit_override=5)
    db_session.add(org)
    db_session.commit()

    assert clear_stale_basic_monthly_overrides(db_engine) == 1
    assert clear_stale_basic_monthly_overrides(db_engine) == 0
    db_session.refresh(org)
    assert org.monthly_limit == 100
