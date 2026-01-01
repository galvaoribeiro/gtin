"""
Router de Billing - Integração com Stripe.
===========================================
Endpoints para gerenciar assinaturas, pagamentos e webhooks.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.api.deps import get_db, get_current_user
from app.db.models import Organization, User
from app.services.stripe_service import StripeService
from app.schemas.organization import OrganizationResponse
from pydantic import BaseModel, Field


router = APIRouter(prefix="/api/v1/billing", tags=["Billing"])


# =============================================================================
# Schemas
# =============================================================================

class CheckoutSessionRequest(BaseModel):
    """Request para criar sessão de checkout."""
    plan: str = Field(..., description="Plano: starter, pro, advanced")


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
    daily_limit: int


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
    new_plan: str = Field(..., description="Novo plano: basic, starter, pro, advanced")


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
        daily_limit=org.get_daily_limit_by_plan()
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
        daily_limit=org.get_daily_limit_by_plan()
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
    Cria uma sessão de checkout do Stripe para iniciar/atualizar subscription.
    """
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organização não encontrada")
    
    # Verificar se o plano é válido
    if request.plan not in ["starter", "pro", "advanced"]:
        raise HTTPException(
            status_code=400,
            detail="Plano inválido. Escolha entre: starter, pro, advanced"
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
    
    # URLs de retorno (ajustar conforme seu frontend)
    import os

    # logo após os imports
    FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")

    # dentro de create_checkout_session
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
    return_url = "http://localhost:3000/billing"
    
    try:
        session = StripeService.create_billing_portal_session(
            customer_id=org.stripe_customer_id,
            return_url=return_url
        )
        
        return BillingPortalResponse(url=session.url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar portal: {str(e)}")


@router.post("/switch-plan")
def switch_plan(
    request: SwitchPlanRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Troca de plano. Para downgrade para 'basic', cancela subscription.
    Para upgrade/downgrade entre planos pagos, atualiza subscription no Stripe.
    """
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organização não encontrada")
    
    new_plan = request.new_plan
    
    # Validar plano
    if new_plan not in ["basic", "starter", "pro", "advanced"]:
        raise HTTPException(status_code=400, detail="Plano inválido")
    
    # Downgrade para basic (grátis) - cancelar subscription
    if new_plan == "basic":
        if org.stripe_subscription_id:
            try:
                StripeService.cancel_subscription(org.stripe_subscription_id)
                org.plan = "basic"
                org.subscription_status = "canceled"
                org.daily_limit = 15
                db.commit()
                return {"message": "Plano alterado para Basic. Subscription cancelada."}
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Erro ao cancelar subscription: {str(e)}")
        else:
            org.plan = "basic"
            org.daily_limit = 15
            db.commit()
            return {"message": "Plano alterado para Basic"}
    
    # Upgrade/downgrade entre planos pagos
    if org.stripe_subscription_id:
        try:
            StripeService.update_subscription_plan(org.stripe_subscription_id, new_plan)
            org.plan = new_plan
            org.daily_limit = org.get_daily_limit_by_plan()
            db.commit()
            return {"message": f"Plano alterado para {new_plan}"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao atualizar plano: {str(e)}")
    else:
        # Não tem subscription, precisa criar via checkout
        raise HTTPException(
            status_code=400,
            detail="Você precisa criar uma assinatura primeiro. Use /checkout-session"
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

            org.stripe_subscription_id = subscription_data["stripe_subscription_id"]
            org.subscription_status = subscription_data["subscription_status"]
            org.current_period_end = subscription_data["current_period_end"]
            org.plan = subscription_data["plan"]
            org.daily_limit = org.get_daily_limit_by_plan()
            org.default_payment_method = subscription_data["default_payment_method"]

            print(f"org.stripe_subscription_id: {org.stripe_subscription_id}")
            print(f"org.subscription_status: {org.subscription_status}")
            print(f"org.current_period_end: {org.current_period_end}")
            print(f"org.plan: {org.plan}")
            print(f"org.daily_limit: {org.daily_limit}")
            print(f"org.default_payment_method: {org.default_payment_method}")

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
            org.daily_limit = 15
            org.stripe_subscription_id = None
            db.commit()
            print(f"[WEBHOOK] Organização {org.id} voltou para plano Basic")
    
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
                org.stripe_subscription_id = subscription_data["stripe_subscription_id"]
                org.subscription_status = subscription_data["subscription_status"]
                org.current_period_end = subscription_data["current_period_end"]
                org.plan = subscription_data["plan"]
                org.daily_limit = org.get_daily_limit_by_plan()
                org.default_payment_method = subscription_data["default_payment_method"]
                db.commit()
                

                print(f"org.stripe_subscription_id: {org.stripe_subscription_id}")
                print(f"org.subscription_status: {org.subscription_status}")
                print(f"org.current_period_end: {org.current_period_end}")
                print(f"org.plan: {org.plan}")
                print(f"org.daily_limit: {org.daily_limit}")
                print(f"org.default_payment_method: {org.default_payment_method}")

                print(f"[WEBHOOK] (checkout.completed) Organização {org.id} atualizada para {org.plan}")

    return {"status": "success"}

