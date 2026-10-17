"""
Consulta somente leitura de cadastros novos (automação).
=======================================================
GET /api/admin/signups autenticado por ADMIN_READONLY_TOKEN.
Não escreve no banco e não expõe senhas nem outros segredos.
"""

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import require_admin_readonly_token
from app.db.models import Organization, User
from app.db.session import get_db
from app.schemas.admin import AdminSignupOrganization, AdminSignupUser, AdminSignupsResponse

router = APIRouter(prefix="/api/admin", tags=["Admin Read-only"])

SIGNUPS_DEFAULT_LIMIT = 200
SIGNUPS_MAX_LIMIT = 500


def _as_naive_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value
    return value.astimezone(timezone.utc).replace(tzinfo=None)


def _parse_since(since: Optional[str]) -> Optional[datetime]:
    if since is None:
        return None
    raw = since.strip()
    if not raw:
        return None
    if raw.endswith("Z"):
        raw = raw[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(raw)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Parâmetro since inválido. Use ISO 8601 (ex.: 2026-10-16 ou 2026-10-16T00:00:00Z).",
        )
    return _as_naive_utc(parsed)


@router.get(
    "/signups",
    response_model=AdminSignupsResponse,
    summary="Cadastros novos (somente leitura)",
    description=(
        "Lista usuários e organizações criados após since_id e/ou since. "
        "Autenticação: Authorization: Bearer <ADMIN_READONLY_TOKEN>."
    ),
    responses={
        200: {"description": "Lista de cadastros"},
        401: {"description": "Token ausente ou inválido"},
        429: {"description": "Rate limit excedido"},
        503: {"description": "ADMIN_READONLY_TOKEN não configurado"},
    },
)
def list_signups(
    since_id: Optional[int] = Query(None, ge=0, description="Retorna registros com id maior que este valor"),
    since: Optional[str] = Query(None, description="ISO 8601: retorna registros com created_at posterior"),
    limit: int = Query(SIGNUPS_DEFAULT_LIMIT, ge=1, le=SIGNUPS_MAX_LIMIT),
    _: None = Depends(require_admin_readonly_token),
    db: Session = Depends(get_db),
):
    since_dt = _parse_since(since)
    incremental = since_id is not None or since_dt is not None
    order_users = User.id.asc() if incremental else User.id.desc()
    order_orgs = Organization.id.asc() if incremental else Organization.id.desc()

    user_query = db.query(User).options(joinedload(User.organization))
    org_query = db.query(Organization)

    if since_id is not None:
        user_query = user_query.filter(User.id > since_id)
        org_query = org_query.filter(Organization.id > since_id)
    if since_dt is not None:
        user_query = user_query.filter(User.created_at > since_dt)
        org_query = org_query.filter(Organization.created_at > since_dt)

    users = user_query.order_by(order_users).limit(limit).all()
    organizations = org_query.order_by(order_orgs).limit(limit).all()

    org_ids = [org.id for org in organizations]
    users_by_org: dict[int, list[int]] = {org_id: [] for org_id in org_ids}
    org_emails: dict[int, str] = {}
    if org_ids:
        for user_id, organization_id, email in (
            db.query(User.id, User.organization_id, User.email)
            .filter(User.organization_id.in_(org_ids))
            .order_by(User.id.asc())
            .all()
        ):
            users_by_org.setdefault(organization_id, []).append(user_id)
            org_emails.setdefault(organization_id, email)

    user_items = []
    for user in users:
        org = user.organization
        user_items.append(
            AdminSignupUser(
                id=user.id,
                email=user.email,
                name=org.name if org else None,
                plan=org.plan if org else None,
                subscription_status=org.subscription_status if org else None,
                created_at=user.created_at,
                organization_id=user.organization_id,
                organization_name=org.name if org else None,
            )
        )

    org_items = [
        AdminSignupOrganization(
            id=org.id,
            name=org.name,
            email=org_emails.get(org.id),
            plan=org.plan,
            subscription_status=org.subscription_status,
            created_at=org.created_at,
            user_ids=users_by_org.get(org.id, []),
        )
        for org in organizations
    ]

    return AdminSignupsResponse(users=user_items, organizations=org_items)
