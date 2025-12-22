"""
Serviço de integração com Stripe.
===================================
Gerencia customers, subscriptions, billing portal e webhooks.
"""

import stripe
from typing import Optional, Dict, Any
from datetime import datetime

from app.core.config import settings

# Configurar chave secreta do Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


class StripeService:
    """Serviço para operações com Stripe."""
    
    # Mapeamento de planos para Price IDs do Stripe
    PLAN_PRICE_MAP = {
        "starter": settings.STRIPE_PRICE_STARTER,
        "pro": settings.STRIPE_PRICE_PRO,
        "enterprise": settings.STRIPE_PRICE_ENTERPRISE,
    }
    
    # Plano basic é gratuito (sem Stripe)
    FREE_PLANS = ["basic"]
    
    @classmethod
    def get_or_create_customer(
        cls,
        email: str,
        name: str,
        organization_id: int,
        stripe_customer_id: Optional[str] = None
    ) -> stripe.Customer:
        """
        Recupera ou cria um customer no Stripe.
        
        Args:
            email: Email do cliente
            name: Nome da organização
            organization_id: ID interno da organização
            stripe_customer_id: ID do customer existente (opcional)
            
        Returns:
            Objeto Customer do Stripe
        """
        if stripe_customer_id:
            try:
                return stripe.Customer.retrieve(stripe_customer_id)
            except stripe.error.InvalidRequestError:
                # Customer não existe, criar novo
                pass
        
        # Criar novo customer
        customer = stripe.Customer.create(
            email=email,
            name=name,
            metadata={
                "organization_id": str(organization_id),
            }
        )
        return customer
    
    @classmethod
    def create_checkout_session(
        cls,
        customer_id: str,
        plan: str,
        success_url: str,
        cancel_url: str,
        organization_id: int
    ) -> stripe.checkout.Session:
        """
        Cria uma sessão de checkout do Stripe.
        
        Args:
            customer_id: ID do customer no Stripe
            plan: Nome do plano (starter, pro, enterprise)
            success_url: URL de redirecionamento após sucesso
            cancel_url: URL de redirecionamento após cancelamento
            organization_id: ID da organização
            
        Returns:
            Sessão de checkout do Stripe
            
        Raises:
            ValueError: Se o plano for inválido
        """
        if plan in cls.FREE_PLANS:
            raise ValueError(f"Plano '{plan}' é gratuito e não requer checkout")
        
        price_id = cls.PLAN_PRICE_MAP.get(plan)
        if not price_id:
            raise ValueError(f"Plano '{plan}' não encontrado")
        
        session = stripe.checkout.Session.create(
            customer=customer_id,
            mode="subscription",
            payment_method_types=["card"],
            line_items=[{
                "price": price_id,
                "quantity": 1,
            }],
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "organization_id": str(organization_id),
                "plan": plan,
            },
            allow_promotion_codes=True,
            billing_address_collection="required",
        )
        return session
    
    @classmethod
    def create_billing_portal_session(
        cls,
        customer_id: str,
        return_url: str
    ) -> stripe.billing_portal.Session:
        """
        Cria uma sessão do portal de cobrança.
        
        Args:
            customer_id: ID do customer no Stripe
            return_url: URL de retorno após sair do portal
            
        Returns:
            Sessão do portal de cobrança
        """
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=return_url,
        )
        return session
    
    @classmethod
    def get_subscription(cls, subscription_id: str) -> Optional[stripe.Subscription]:
        """
        Recupera uma subscription do Stripe.
        
        Args:
            subscription_id: ID da subscription
            
        Returns:
            Objeto Subscription ou None se não encontrado
        """
        try:
            return stripe.Subscription.retrieve(subscription_id)
        except stripe.error.InvalidRequestError:
            return None
    
    @classmethod
    def cancel_subscription(cls, subscription_id: str) -> stripe.Subscription:
        """
        Cancela uma subscription ao final do período.
        
        Args:
            subscription_id: ID da subscription
            
        Returns:
            Subscription atualizada
        """
        return stripe.Subscription.modify(
            subscription_id,
            cancel_at_period_end=True
        )
    
    @classmethod
    def reactivate_subscription(cls, subscription_id: str) -> stripe.Subscription:
        """
        Reativa uma subscription que estava marcada para cancelamento.
        
        Args:
            subscription_id: ID da subscription
            
        Returns:
            Subscription atualizada
        """
        return stripe.Subscription.modify(
            subscription_id,
            cancel_at_period_end=False
        )
    
    @classmethod
    def update_subscription_plan(
        cls,
        subscription_id: str,
        new_plan: str
    ) -> stripe.Subscription:
        """
        Atualiza o plano de uma subscription existente.
        
        Args:
            subscription_id: ID da subscription
            new_plan: Novo plano (starter, pro, enterprise)
            
        Returns:
            Subscription atualizada
            
        Raises:
            ValueError: Se o plano for inválido
        """
        price_id = cls.PLAN_PRICE_MAP.get(new_plan)
        if not price_id:
            raise ValueError(f"Plano '{new_plan}' não encontrado")
        
        # Recuperar subscription atual
        subscription = stripe.Subscription.retrieve(subscription_id)
        
        # Atualizar o item da subscription
        return stripe.Subscription.modify(
            subscription_id,
            items=[{
                "id": subscription["items"]["data"][0].id,
                "price": price_id,
            }],
            proration_behavior="create_prorations",
            metadata={
                **subscription.metadata,
                "plan": new_plan,
            }
        )
    
    @classmethod
    def list_invoices(
        cls,
        customer_id: str,
        limit: int = 10
    ) -> list:
        """
        Lista as faturas de um customer.
        
        Args:
            customer_id: ID do customer
            limit: Número máximo de faturas a retornar
            
        Returns:
            Lista de invoices
        """
        invoices = stripe.Invoice.list(
            customer=customer_id,
            limit=limit
        )
        return invoices.data
    
    @classmethod
    def get_payment_methods(cls, customer_id: str) -> list:
        """
        Lista os métodos de pagamento de um customer.
        
        Args:
            customer_id: ID do customer
            
        Returns:
            Lista de payment methods
        """
        payment_methods = stripe.PaymentMethod.list(
            customer=customer_id,
            type="card"
        )
        return payment_methods.data
    
    @classmethod
    def parse_webhook_event(
        cls,
        payload: bytes,
        signature: str
    ) -> stripe.Event:
        """
        Valida e parseia um evento de webhook do Stripe.
        
        Args:
            payload: Corpo da requisição (bytes)
            signature: Header Stripe-Signature
            
        Returns:
            Evento do Stripe parseado e validado
            
        Raises:
            ValueError: Se a assinatura for inválida
        """
        try:
            event = stripe.Webhook.construct_event(
                payload,
                signature,
                settings.STRIPE_WEBHOOK_SECRET
            )
            return event
        except ValueError as e:
            raise ValueError(f"Payload inválido: {e}")
        except stripe.error.SignatureVerificationError as e:
            raise ValueError(f"Assinatura inválida: {e}")
    
    @classmethod
    def extract_subscription_data(cls, subscription: stripe.Subscription) -> Dict[str, Any]:
        """
        Extrai dados relevantes de uma subscription para persistir no banco.
        
        Args:
            subscription: Objeto Subscription do Stripe
            
        Returns:
            Dicionário com dados da subscription
        """
        plan_name = subscription.metadata.get("plan", "starter")
        
        return {
            "stripe_subscription_id": subscription.id,
            "subscription_status": subscription.status,
            "current_period_end": datetime.fromtimestamp(subscription.current_period_end),
            "plan": plan_name,
            "default_payment_method": subscription.default_payment_method,
        }

