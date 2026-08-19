"""
Endpoints administrativos (staff).
=================================
Permite listar/editar usuários e organizações e executar impersonação.
Todos os endpoints exigem role=admin.
"""

from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import require_admin_user
from app.core.config import settings
from app.core.security import create_access_token, get_password_hash
from app.db.models import ALL_PLANS, AdminAuditLog, Organization, User
from app.db.session import get_db
from app.schemas.admin import (
    AdminEnterpriseUpgradeLinkResponse,
    AdminOrganizationItem,
    AdminOrganizationUpdate,
    AdminOrganizationsPage,
    AdminUserItem,
    AdminUserUpdate,
    AdminUsersPage,
)
from app.schemas.user import Token
from app.services.stripe_service import StripeService

router = APIRouter(prefix="/v1/admin", tags=["Admin"])

# Status em que uma assinatura ainda pode ter o item de Price substituído
SWITCHABLE_SUBSCRIPTION_STATUSES = ("active", "trialing", "past_due")


def _request_meta(request: Request) -> tuple[Optional[str], Optional[str]]:
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")
    return ip, ua


def _audit(
    db: Session,
    *,
    actor_id: int,
    action: str,
    target_user_id: Optional[int] = None,
    target_org_id: Optional[int] = None,
    payload: Optional[dict] = None,
    ip: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> None:
    db.add(
        AdminAuditLog(
            actor_user_id=actor_id,
            action=action,
            target_user_id=target_user_id,
            target_org_id=target_org_id,
            payload=payload,
            ip=ip,
            user_agent=user_agent,
        )
    )


# ── Users ────────────────────────────────────────────────────────────────────


@router.get("/users", response_model=AdminUsersPage)
def list_users(
    request: Request,
    page: int = 1,
    per_page: int = 20,
    q: Optional[str] = None,
    organization_id: Optional[int] = None,
    admin: User = Depends(require_admin_user),
    db: Session = Depends(get_db),
):
    page = max(page, 1)
    per_page = min(max(per_page, 1), 200)

    query = db.query(User)
    if q:
        query = query.filter(User.email.ilike(f"%{q.strip()}%"))
    if organization_id is not None:
        query = query.filter(User.organization_id == organization_id)

    total = query.count()
    rows = (
        query.order_by(User.id.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    items = [
        AdminUserItem(
            id=u.id,
            email=u.email,
            organization_id=u.organization_id,
            organization_name=u.organization.name if u.organization else None,
            role=getattr(u, "role", "user") or "user",
            is_active=u.is_active,
            created_at=u.created_at,
        )
        for u in rows
    ]

    ip, ua = _request_meta(request)
    _audit(db, actor_id=admin.id, action="users.list",
           payload={"page": page, "q": q, "organization_id": organization_id},
           ip=ip, user_agent=ua)
    db.commit()

    return AdminUsersPage(items=items, page=page, per_page=per_page, total=total)


@router.patch("/users/{user_id}", response_model=AdminUserItem)
def update_user(
    user_id: int,
    data: AdminUserUpdate,
    request: Request,
    admin: User = Depends(require_admin_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")

    changes: dict = {}
    raw = data.model_dump(exclude_unset=True)

    if "is_active" in raw:
        changes["is_active"] = {"from": user.is_active, "to": raw["is_active"]}
        user.is_active = bool(raw["is_active"])

    if "role" in raw:
        role = (raw["role"] or "").strip().lower()
        if role not in ("user", "admin"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="role inválida (user/admin)")
        changes["role"] = {"from": getattr(user, "role", "user"), "to": role}
        user.role = role

    if raw.get("new_password"):
        user.hashed_password = get_password_hash(raw["new_password"])
        changes["password_reset"] = True

    db.flush()

    ip, ua = _request_meta(request)
    _audit(db, actor_id=admin.id, action="users.update",
           target_user_id=user.id, payload=changes, ip=ip, user_agent=ua)
    db.commit()
    db.refresh(user)

    return AdminUserItem(
        id=user.id,
        email=user.email,
        organization_id=user.organization_id,
        organization_name=user.organization.name if user.organization else None,
        role=getattr(user, "role", "user") or "user",
        is_active=user.is_active,
        created_at=user.created_at,
    )


@router.post("/users/{user_id}/impersonate", response_model=Token)
def impersonate_user(
    user_id: int,
    request: Request,
    admin: User = Depends(require_admin_user),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")
    if not target.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usuário desativado")

    token = create_access_token(
        data={
            "sub": str(target.id),
            "email": target.email,
            "impersonated": True,
            "actor_sub": str(admin.id),
            "actor_email": admin.email,
        },
        expires_delta=timedelta(minutes=30),
    )

    ip, ua = _request_meta(request)
    _audit(db, actor_id=admin.id, action="users.impersonate",
           target_user_id=target.id, target_org_id=target.organization_id,
           payload={"expires_minutes": 30}, ip=ip, user_agent=ua)
    db.commit()

    return Token(access_token=token, token_type="bearer")


# ── Organizations ────────────────────────────────────────────────────────────


@router.get("/organizations", response_model=AdminOrganizationsPage)
def list_organizations(
    request: Request,
    page: int = 1,
    per_page: int = 20,
    q: Optional[str] = None,
    admin: User = Depends(require_admin_user),
    db: Session = Depends(get_db),
):
    page = max(page, 1)
    per_page = min(max(per_page, 1), 200)

    query = db.query(Organization)
    if q:
        query = query.filter(Organization.name.ilike(f"%{q.strip()}%"))

    total = query.count()
    rows = (
        query.order_by(Organization.id.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    ip, ua = _request_meta(request)
    _audit(db, actor_id=admin.id, action="organizations.list",
           payload={"page": page, "q": q}, ip=ip, user_agent=ua)
    db.commit()

    return AdminOrganizationsPage(
        items=[AdminOrganizationItem.model_validate(o) for o in rows],
        page=page,
        per_page=per_page,
        total=total,
    )


@router.get("/organizations/{org_id}", response_model=AdminOrganizationItem)
def get_organization(
    org_id: int,
    admin: User = Depends(require_admin_user),
    db: Session = Depends(get_db),
):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organização não encontrada")
    return AdminOrganizationItem.model_validate(org)


@router.patch("/organizations/{org_id}", response_model=AdminOrganizationItem)
def update_organization(
    org_id: int,
    data: AdminOrganizationUpdate,
    request: Request,
    admin: User = Depends(require_admin_user),
    db: Session = Depends(get_db),
):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organização não encontrada")

    raw = data.model_dump(exclude_unset=True)
    before: dict = {}
    after: dict = {}

    if "name" in raw:
        before["name"] = org.name
        org.name = raw["name"]
        after["name"] = raw["name"]

    if "plan" in raw:
        plan = (raw["plan"] or "").strip().lower()
        if plan not in ALL_PLANS:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="plan inválido")
        before["plan"] = org.plan
        org.plan = plan
        after["plan"] = plan

    for field in ("stripe_customer_id", "stripe_subscription_id",
                  "subscription_status", "current_period_end", "default_payment_method"):
        if field in raw:
            before[field] = str(getattr(org, field)) if getattr(org, field) is not None else None
            setattr(org, field, raw[field])
            after[field] = str(raw[field]) if raw[field] is not None else None

    db.flush()

    ip, ua = _request_meta(request)
    _audit(db, actor_id=admin.id, action="organizations.update",
           target_org_id=org.id, payload={"before": before, "after": after},
           ip=ip, user_agent=ua)
    db.commit()
    db.refresh(org)

    return AdminOrganizationItem.model_validate(org)


@router.post(
    "/organizations/{org_id}/provision-enterprise",
    response_model=AdminEnterpriseUpgradeLinkResponse,
    summary="Gerar link de upgrade para o plano Enterprise",
    description=(
        "Gera um link do Portal de Cobrança do Stripe restrito à troca para o Price Enterprise "
        "na assinatura já existente da organização. O próprio cliente deve abrir o link e "
        "confirmar: é só nesse momento que o Stripe cobra o ajuste proporcional "
        "(proration_behavior=always_invoice) e o plano é sincronizado no banco via webhook. "
        "Este endpoint não cobra nada e não altera o plano por conta própria. Exclusivo para "
        "administradores."
    ),
)
def provision_enterprise(
    org_id: int,
    request: Request,
    admin: User = Depends(require_admin_user),
    db: Session = Depends(get_db),
):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organização não encontrada")

    if org.plan == "enterprise":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta organização já está no plano Enterprise.",
        )

    if not settings.STRIPE_PRICE_ENTERPRISE:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="STRIPE_PRICE_ENTERPRISE não configurado. Cadastre o Price Enterprise antes de gerar o link.",
        )

    if not org.stripe_subscription_id or not org.stripe_customer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Esta organização não possui assinatura no Stripe. Faça a contratação inicial "
                "com o cliente antes de gerar o link de migração para o Enterprise."
            ),
        )

    subscription = StripeService.get_subscription(org.stripe_subscription_id)
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assinatura não encontrada no Stripe. Verifique o stripe_subscription_id da organização.",
        )

    if subscription.get("status") not in SWITCHABLE_SUBSCRIPTION_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"A assinatura está com status '{subscription.get('status')}' e não pode ser migrada. "
                "Regularize a assinatura antes de gerar o link do Enterprise."
            ),
        )

    return_url = f"{settings.FRONTEND_BASE_URL.rstrip('/')}/billing?enterprise=pending"

    try:
        portal_session = StripeService.create_enterprise_upgrade_portal_session(
            customer_id=org.stripe_customer_id,
            subscription_id=org.stripe_subscription_id,
            return_url=return_url,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Erro ao gerar o link no Stripe: {exc}",
        )

    ip, ua = _request_meta(request)
    _audit(
        db,
        actor_id=admin.id,
        action="organizations.enterprise_link_generated",
        target_org_id=org.id,
        payload={
            "stripe_subscription_id": org.stripe_subscription_id,
            "proration_behavior": "always_invoice",
        },
        ip=ip,
        user_agent=ua,
    )
    db.commit()

    return AdminEnterpriseUpgradeLinkResponse(
        message=(
            "Link gerado. Envie-o ao cliente: a troca só é efetivada e cobrada quando ele mesmo "
            "confirmar no Portal de Cobrança."
        ),
        portal_url=portal_session.url,
        organization_id=org.id,
    )
