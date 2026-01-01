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
        "advanced": settings.STRIPE_PRICE_ADVANCED,
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
            plan: Nome do plano (starter, pro, advanced)
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
            # Propaga metadata também para a subscription gerada
            subscription_data={
                "metadata": {
                    "organization_id": str(organization_id),
                    "plan": plan,
                }
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
            new_plan: Novo plano (starter, pro, advanced)
            
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
    def get_customer(cls, customer_id: str) -> Optional[stripe.Customer]:
        """
        Recupera um customer do Stripe.
        
        Args:
            customer_id: ID do customer
            
        Returns:
            Objeto Customer ou None se não encontrado
        """
        try:
            return stripe.Customer.retrieve(customer_id)
        except stripe.error.InvalidRequestError:
            return None
    
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
    def _map_price_to_plan(cls, price_id: Optional[str]) -> str:
        """Inverte o mapa de prices para plano."""
        if not price_id:
            return "basic"
        for plan, pid in cls.PLAN_PRICE_MAP.items():
            print(f"plan in _map_price_to_plan: {plan}")
            print(f"pid in _map_price_to_plan: {pid}")
            print(f"price_id in _map_price_to_plan: {price_id}")
            if pid == price_id:
                return plan
        return "basic"

    @classmethod
    def extract_subscription_data(cls, subscription: stripe.Subscription) -> Dict[str, Any]:
        """
        Extrai dados relevantes de uma subscription para persistir no banco.
        
        Args:
            subscription: Objeto Subscription do Stripe
            
        Returns:
            Dicionário com dados da subscription
        """
        # Alguns eventos (ex.: created) podem não trazer todos os campos.
        # Usamos .get e fallback no item 0.
        # NOTE: StripeObject se comporta como dict.
        current_period_end = (
            subscription.get("current_period_end")
            or subscription.get("current_period_end", None)
        )
        print(f"current_period_end in extract_subscription_data: {current_period_end}")
        if not current_period_end:
            try:
                items = subscription.get("items", {}).get("data", [])
                #print(f"items in extract_subscription_data (current_period_end): {items}")
                if items:
                    current_period_end = items[0].get("current_period_end")
            except Exception:
                current_period_end = None
        # Fallback: se ainda não houver, mantém None

        # Plano: usa metadata.plan; se vazio, mapeia pelo price_id do item 0
        plan_name = subscription.get("metadata", {}).get("plan")
        print(f"plan_name in extract_subscription_data: {plan_name}")
        if not plan_name:
            try:
                items = subscription.get("items", {}).get("data", [])
                #print(f"items in extract_subscription_data (plan_name): {items}")
                if items:
                    price_id = items[0].get("price", {}).get("id")
                    print(f"price_id in extract_subscription_data (plan_name): {price_id}")
                    plan_name = cls._map_price_to_plan(price_id)
            except Exception:
                plan_name = "basic"

        # Default payment method pode vir como None em created
        default_pm = subscription.get("default_payment_method")
        print(f"default_pm in extract_subscription_data: {default_pm}")
        return {
            "stripe_subscription_id": subscription.get("id"),
            "subscription_status": subscription.get("status"),
            "current_period_end": datetime.fromtimestamp(current_period_end) if current_period_end else None,
            "plan": plan_name or "basic",
            "default_payment_method": default_pm,
        }

