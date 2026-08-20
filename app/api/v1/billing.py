"""
Router de Billing - Integração com Stripe.
===========================================
Endpoints para gerenciar assinaturas, pagamentos e webhooks.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import os

from app.api.deps import get_db, get_current_user
from app.core.config import settings
from app.db.models import PRIVATE_PLANS, PUBLIC_PLANS, Organization, User
from app.services.stripe_service import StripeService
from app.schemas.organization import OrganizationResponse
from pydantic import BaseModel, Field


router = APIRouter(prefix="/api/v1/billing", tags=["Billing"])

# URL base do frontend (configurável via variável de ambiente)
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")

# Planos que o cliente pode contratar sozinho (basic é gratuito e não usa checkout)
PUBLIC_PAID_PLANS = [p for p in PUBLIC_PLANS if p != "basic"]


def _reject_private_plan(plan: str) -> None:
    """
    Impede que um plano negociado seja contratado pelo self-service, mesmo que
    o cliente descubra o slug e chame a API diretamente.
    """
    if plan in PRIVATE_PLANS:
        raise HTTPException(
            status_code=403,
            detail="Este plano é negociado com nosso time comercial e não pode ser contratado por aqui.",
        )


def _apply_subscription_to_org(org: Organization, subscription_data: dict) -> None:
    """
    Sincroniza a organização com os dados de uma subscription do Stripe.

    O plano só é sobrescrito quando o Price/metadata é reconhecido: um Price
    desconhecido não pode rebaixar silenciosamente um cliente para basic.
    """
    org.stripe_subscription_id = subscription_data["stripe_subscription_id"]
    org.subscription_status = subscription_data["subscription_status"]
    org.current_period_end = subscription_data["current_period_end"]
    org.default_payment_method = subscription_data["default_payment_method"]

    plan = subscription_data["plan"]
    if plan:
        if plan != org.plan:
            # Plano realmente mudou (upgrade ou downgrade) → remover overrides manuais
            org.batch_limit_override = None
            org.monthly_limit_override = None
        org.plan = plan
    else:
        print(
            "[WEBHOOK] Price desconhecido na subscription "
            f"{subscription_data['stripe_subscription_id']}; "
            f"mantendo plano atual da organização {org.id}: {org.plan}"
        )


# =============================================================================
# Schemas
# =============================================================================

class CheckoutSessionRequest(BaseModel):
    """Request para criar sessão de checkout."""
    plan: str = Field(..., description="Plano self-service: starter, pro, advanced")


class CheckoutSessionResponse(BaseModel):
    """Response com URL da sessão de checkout."""
    url: str = Field(..., description="URL do checkout Stripe")
    session_id: str = Field(..., description="ID da sessão")


class BillingPortalResponse(BaseModel):
    """Response com URL do portal de cobrança."""
    url: str = Field(..., description="URL do portal de cobrança Stripe")


class SubscriptionResponse(BaseModel):
    """Response com detalhes da subscription."""
    plan: str
    status: Optional[str]
    current_period_end: Optional[datetime]
    cancel_at_period_end: bool = False
    monthly_limit: int
    batch_limit: int
    api_key_limit: int


class InvoiceItem(BaseModel):
    """Item de fatura."""
    id: str
    date: datetime
    amount: float
    status: str
    invoice_pdf: Optional[str]


class PaymentMethodItem(BaseModel):
    """Método de pagamento."""
    id: str
    brand: str
    last4: str
    exp_month: int
    exp_year: int
    is_default: bool


class BillingDataResponse(BaseModel):
    """Dados completos de billing."""
    subscription: SubscriptionResponse
    invoices: List[InvoiceItem]
    payment_methods: List[PaymentMethodItem]


class SwitchPlanRequest(BaseModel):
    """Request para trocar de plano."""
    new_plan: str = Field(..., description="Novo plano self-service: basic, starter, pro, advanced")


class SwitchPlanResponse(BaseModel):
    """Response da troca de plano."""
    message: str
    portal_url: Optional[str] = None


# =============================================================================
# Endpoints
# =============================================================================

@router.get("/subscription", response_model=SubscriptionResponse)
def get_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retorna detalhes da subscription atual da organização.
    """
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organização não encontrada")
    
    # Se tem subscription ativa no Stripe, buscar detalhes
    cancel_at_period_end = False
    if org.stripe_subscription_id:
        subscription = StripeService.get_subscription(org.stripe_subscription_id)
        if subscription:
            cancel_at_period_end = subscription.cancel_at_period_end
    
    return SubscriptionResponse(
        plan=org.plan,
        status=org.subscription_status,
        current_period_end=org.current_period_end,
        cancel_at_period_end=cancel_at_period_end,
        monthly_limit=org.monthly_limit,
        batch_limit=org.batch_limit,
        api_key_limit=org.api_key_active_limit,
    )


@router.get("/data", response_model=BillingDataResponse)
def get_billing_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retorna todos os dados de billing: subscription, invoices e payment methods.
    """
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organização não encontrada")
    
    # Subscription
    cancel_at_period_end = False
    if org.stripe_subscription_id:
        subscription = StripeService.get_subscription(org.stripe_subscription_id)
        if subscription:
            cancel_at_period_end = subscription.cancel_at_period_end
    
    subscription_data = SubscriptionResponse(
        plan=org.plan,
        status=org.subscription_status,
        current_period_end=org.current_period_end,
        cancel_at_period_end=cancel_at_period_end,
        monthly_limit=org.monthly_limit,
        batch_limit=org.batch_limit,
        api_key_limit=org.api_key_active_limit,
    )
    
    # Invoices e Payment Methods (só se tiver customer no Stripe)
    invoices = []
    payment_methods = []
    
    if org.stripe_customer_id:
        try:
            # Buscar invoices
            stripe_invoices = StripeService.list_invoices(org.stripe_customer_id, limit=12)
            invoices = [
                InvoiceItem(
                    id=inv.id,
                    date=datetime.fromtimestamp(inv.created),
                    amount=inv.amount_paid / 100,  # Stripe usa centavos
                    status=inv.status,
                    invoice_pdf=inv.invoice_pdf
                )
                for inv in stripe_invoices
            ]
            
            # Buscar payment methods
            stripe_pms = StripeService.get_payment_methods(org.stripe_customer_id)
            payment_methods = [
                PaymentMethodItem(
                    id=pm.id,
                    brand=pm.card.brand,
                    last4=pm.card.last4,
                    exp_month=pm.card.exp_month,
                    exp_year=pm.card.exp_year,
                    is_default=(pm.id == org.default_payment_method)
                )
                for pm in stripe_pms
            ]
        except Exception as e:
            print(f"[BILLING] Erro ao buscar dados do Stripe: {e}")
    
    return BillingDataResponse(
        subscription=subscription_data,
        invoices=invoices,
        payment_methods=payment_methods
    )


@router.post("/checkout-session", response_model=CheckoutSessionResponse)
def create_checkout_session(
    request: CheckoutSessionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cria uma sessão de checkout do Stripe para iniciar uma nova subscription.
    Clientes com assinatura ativa devem usar /switch-plan.
    """
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organização não encontrada")

    if not settings.BILLING_PLAN_CHANGES_ENABLED:
        raise HTTPException(
            status_code=503,
            detail="Mudanças de plano temporariamente indisponíveis."
        )

    if org.stripe_subscription_id:
        subscription = StripeService.get_subscription(org.stripe_subscription_id)
        if subscription and subscription.status in ("active", "trialing", "past_due"):
            raise HTTPException(
                status_code=400,
                detail="Você já possui uma assinatura ativa. Use a troca de plano."
            )
    
    # Verificar se o plano é válido
    _reject_private_plan(request.plan)
    if request.plan not in PUBLIC_PAID_PLANS:
        raise HTTPException(
            status_code=400,
            detail=f"Plano inválido. Escolha entre: {', '.join(PUBLIC_PAID_PLANS)}"
        )
    
    # Criar ou recuperar customer no Stripe
    customer = StripeService.get_or_create_customer(
        email=current_user.email,
        name=org.name,
        organization_id=org.id,
        stripe_customer_id=org.stripe_customer_id
    )
    
    # Atualizar customer_id no banco se não existia
    if not org.stripe_customer_id:
        org.stripe_customer_id = customer.id
        db.commit()
    
    # URLs de retorno
    success_url = f"{FRONTEND_BASE_URL}/billing?success=true"
    cancel_url = f"{FRONTEND_BASE_URL}/billing?canceled=true"
    
    # Criar sessão de checkout
    try:
        session = StripeService.create_checkout_session(
            customer_id=customer.id,
            plan=request.plan,
            success_url=success_url,
            cancel_url=cancel_url,
            organization_id=org.id
        )
        
        return CheckoutSessionResponse(
            url=session.url,
            session_id=session.id
        )
    except ValueError as e:
        print(f"[WEBHOOK ERROR] Falha na validação: {e}")  # Adicione esta linha
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/customer-portal", response_model=BillingPortalResponse)
def create_customer_portal_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cria uma sessão do portal de cobrança do Stripe.
    Permite ao cliente gerenciar subscription, payment methods, etc.
    """
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organização não encontrada")
    
    if not org.stripe_customer_id:
        raise HTTPException(
            status_code=400,
            detail="Você ainda não tem uma assinatura ativa"
        )
    
    # URL de retorno
    return_url = f"{FRONTEND_BASE_URL}/billing"
    
    try:
        session = StripeService.create_billing_portal_session(
            customer_id=org.stripe_customer_id,
            return_url=return_url
        )
        
        return BillingPortalResponse(url=session.url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar portal: {str(e)}")


@router.post("/switch-plan", response_model=SwitchPlanResponse)
def switch_plan(
    request: SwitchPlanRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Troca de plano. Para downgrade para 'basic', cancela a subscription.
    Para upgrade/downgrade entre planos pagos, abre o Portal do Stripe com
    subscription_update_confirm para que o cliente confirme e pague o ajuste.
    O plano no banco só é atualizado quando o webhook confirma a troca.
    """
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organização não encontrada")

    if not settings.BILLING_PLAN_CHANGES_ENABLED:
        raise HTTPException(
            status_code=503,
            detail="Mudanças de plano temporariamente indisponíveis."
        )

    new_plan = request.new_plan

    # Validar plano
    _reject_private_plan(new_plan)
    if new_plan not in PUBLIC_PLANS:
        raise HTTPException(status_code=400, detail="Plano inválido")

    # Downgrade para basic (grátis) — cancela a subscription diretamente
    if new_plan == "basic":
        if org.stripe_subscription_id:
            try:
                StripeService.cancel_subscription(org.stripe_subscription_id)
                org.plan = "basic"
                org.subscription_status = "canceled"
                db.commit()
                return SwitchPlanResponse(message="Plano alterado para Basic. Subscription cancelada.")
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Erro ao cancelar subscription: {str(e)}")
        else:
            org.plan = "basic"
            db.commit()
            return SwitchPlanResponse(message="Plano alterado para Basic")

    # Upgrade/downgrade entre planos pagos → Portal confirm
    if not org.stripe_subscription_id:
        raise HTTPException(
            status_code=400,
            detail="Você precisa criar uma assinatura primeiro. Use /checkout-session",
        )

    subscription = StripeService.get_subscription(org.stripe_subscription_id)
    if not subscription or subscription.get("status") not in StripeService.SWITCHABLE_SUBSCRIPTION_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"A assinatura está com status inválido para troca de plano.",
        )

    items = (subscription.get("items", {}) or {}).get("data", [])
    if not items:
        raise HTTPException(status_code=400, detail="Subscription sem itens para atualizar.")
    item_id = items[0]["id"]

    new_price_id = StripeService.PLAN_PRICE_MAP.get(new_plan)
    if not new_price_id:
        raise HTTPException(status_code=503, detail=f"Plano '{new_plan}' sem Price configurado.")

    try:
        config_id = StripeService.get_or_create_public_plan_portal_configuration()
        session = StripeService.create_plan_switch_confirm_session(
            customer_id=org.stripe_customer_id,
            subscription_id=org.stripe_subscription_id,
            subscription_item_id=item_id,
            new_price_id=new_price_id,
            configuration_id=config_id,
            return_url=f"{FRONTEND_BASE_URL}/billing?plan_update=pending",
        )
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar link de troca: {str(e)}")

    # O plano não é gravado aqui — será atualizado pelo webhook customer.subscription.updated.
    return SwitchPlanResponse(
        message="Confirme a troca no Portal do Stripe.",
        portal_url=session.url,
    )


@router.post("/webhook", include_in_schema=False)
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Webhook do Stripe para receber eventos de subscription, pagamentos, etc.
    """
    payload = await request.body()
    signature = request.headers.get("stripe-signature")
    
    if not signature:
        raise HTTPException(status_code=400, detail="Signature missing")
    
    try:
        event = StripeService.parse_webhook_event(payload, signature)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Processar eventos relevantes
    event_type = event["type"]
    data_object = event["data"]["object"]
    
    print(f"[WEBHOOK] Recebido evento: {event_type}")
    
    # Subscription criada ou atualizada
    if event_type in ["customer.subscription.created", "customer.subscription.updated"]:
        print(f"[WEBHOOK] Subscription criada ou atualizada")
        subscription_id = data_object["id"]
        customer_id = data_object["customer"]
        organization_id = data_object.get("metadata", {}).get("organization_id")

        # Buscar organização
        org = None
        if organization_id:
            org = db.query(Organization).filter(Organization.id == int(organization_id)).first()
        else:
            org = db.query(Organization).filter(Organization.stripe_customer_id == customer_id).first()

        if org:
            # Garantir que temos a subscription completa (alguns eventos criados não trazem current_period_end)
            subscription_obj = StripeService.get_subscription(subscription_id) or data_object
            subscription_data = StripeService.extract_subscription_data(subscription_obj)

            _apply_subscription_to_org(org, subscription_data)
            db.commit()
            print(f"[WEBHOOK] Organização {org.id} atualizada: {org.plan}, status={org.subscription_status}")
    
    # Subscription deletada/cancelada
    elif event_type == "customer.subscription.deleted":
        subscription_id = data_object["id"]
        
        org = db.query(Organization).filter(
            Organization.stripe_subscription_id == subscription_id
        ).first()

        if org:
            org.plan = "basic"
            org.subscription_status = "canceled"
            org.stripe_subscription_id = None
            # Subscription encerrada ao fim do período → remover overrides manuais
            org.batch_limit_override = None
            org.monthly_limit_override = None
            db.commit()
            print(f"[WEBHOOK] Organização {org.id} voltou para plano Basic; overrides removidos")
    
    # Pagamento de invoice bem-sucedido
    elif event_type == "invoice.payment_succeeded":
        customer_id = data_object["customer"]
        org = db.query(Organization).filter(Organization.stripe_customer_id == customer_id).first()
        
        if org:
            print(f"[WEBHOOK] Pagamento bem-sucedido para organização {org.id}")
            # Você pode registrar o pagamento em uma tabela de transações, enviar email, etc.
    
    # Pagamento falhou
    elif event_type == "invoice.payment_failed":
        customer_id = data_object["customer"]
        org = db.query(Organization).filter(Organization.stripe_customer_id == customer_id).first()

        if org:
            print(f"[WEBHOOK] Pagamento falhou para organização {org.id}")
            org.subscription_status = "past_due"
            db.commit()
            # Enviar notificação por email, etc.
    
    # Checkout concluído: atualizar imediatamente usando a subscription retornada
    elif event_type == "checkout.session.completed":
        print(f"[WEBHOOK] Checkout concluído")
        #print(f"[WEBHOOK] Checkout concluído: {data_object}")
        subscription_id = data_object.get("subscription")
        customer_id = data_object.get("customer")
        organization_id = data_object.get("metadata", {}).get("organization_id")

        org = None
        if organization_id:
            org = db.query(Organization).filter(Organization.id == int(organization_id)).first()
        elif customer_id:
            org = db.query(Organization).filter(Organization.stripe_customer_id == customer_id).first()

        if org and subscription_id:
            subscription_obj = StripeService.get_subscription(subscription_id)
            if subscription_obj:
                subscription_data = StripeService.extract_subscription_data(subscription_obj)
                _apply_subscription_to_org(org, subscription_data)
                db.commit()
                print(f"[WEBHOOK] (checkout.completed) Organização {org.id} atualizada para {org.plan}")
    
    # Customer atualizado (ex.: mudança de payment method padrão)
    elif event_type == "customer.updated":
        customer_id = data_object["id"]
        invoice_settings = data_object.get("invoice_settings", {}) or {}
        default_payment_method = invoice_settings.get("default_payment_method")
        organization_id = data_object.get("metadata", {}).get("organization_id")

        print(
            "[WEBHOOK][customer.updated] "
            f"customer_id={customer_id} "
            f"organization_id_meta={organization_id} "
            f"default_payment_method={default_payment_method} "
            f"invoice_settings={invoice_settings}"
        )

        # Buscar organização priorizando metadata; fallback para stripe_customer_id
        org = None
        if organization_id:
            try:
                org = db.query(Organization).filter(Organization.id == int(organization_id)).first()
            except Exception as e:
                print(f"[WEBHOOK][customer.updated] Erro ao converter organization_id: {e}")
        if not org:
            org = db.query(Organization).filter(Organization.stripe_customer_id == customer_id).first()
            print(f"[WEBHOOK][customer.updated] lookup by customer_id -> {org.id if org else 'not-found'}")
        else:
            print(f"[WEBHOOK][customer.updated] lookup by metadata -> {org.id}")

        if org:
            # Atualizar o método de pagamento padrão
            org.default_payment_method = default_payment_method
            db.commit()
            print(
                "[WEBHOOK][customer.updated] "
                f"Atualizado default_payment_method para org {org.id}: {default_payment_method}"
            )
        else:
            print("[WEBHOOK][customer.updated] Organização não encontrada para este customer")

    return {"status": "success"}