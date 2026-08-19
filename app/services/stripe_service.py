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
        "enterprise": settings.STRIPE_PRICE_ENTERPRISE,
    }
    
    # Plano basic é gratuito (sem Stripe)
    FREE_PLANS = ["basic"]

    # Metadata usado para identificar, entre as Portal Configurations do
    # Stripe, a que foi criada especificamente para o upgrade self-service do
    # Enterprise (mantida fora da configuração padrão do portal).
    ENTERPRISE_PORTAL_CONFIG_METADATA_KEY = "purpose"
    ENTERPRISE_PORTAL_CONFIG_METADATA_VALUE = "enterprise_migration"
    
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
    def _get_enterprise_price_and_product(cls) -> Dict[str, str]:
        """Resolve o Price Enterprise configurado e seu Product no Stripe."""
        price_id = settings.STRIPE_PRICE_ENTERPRISE
        if not price_id:
            raise ValueError("STRIPE_PRICE_ENTERPRISE não configurado")

        price = stripe.Price.retrieve(price_id)
        product = price.get("product")
        product_id = product if isinstance(product, str) else (product or {}).get("id")
        if not product_id:
            raise ValueError(f"Não foi possível determinar o produto do Price '{price_id}'")

        return {"price_id": price_id, "product_id": product_id}

    @classmethod
    def _find_enterprise_portal_configuration(cls, price_id: str) -> Optional[str]:
        """
        Procura, entre as Portal Configurations existentes, uma marcada como
        dedicada à migração Enterprise e já vinculada ao Price atual.
        """
        try:
            configs = stripe.billing_portal.Configuration.list(limit=100)
        except Exception:
            return None

        for config in configs.auto_paging_iter():
            metadata = config.get("metadata", {}) or {}
            if metadata.get(cls.ENTERPRISE_PORTAL_CONFIG_METADATA_KEY) != cls.ENTERPRISE_PORTAL_CONFIG_METADATA_VALUE:
                continue
            sub_update = (config.get("features", {}) or {}).get("subscription_update", {}) or {}
            products = sub_update.get("products") or []
            prices_in_config = {p for item in products for p in (item.get("prices") or [])}
            if price_id in prices_in_config:
                return config["id"]
        return None

    @classmethod
    def get_or_create_enterprise_portal_configuration(cls) -> str:
        """
        Retorna o ID de uma Portal Configuration dedicada exclusivamente à
        troca para o Price Enterprise, criando-a se ainda não existir.

        Fica de fora da configuração padrão do portal (usada pelo botão
        "Gerenciar Assinatura" de autoatendimento), para que o Enterprise
        continue invisível fora deste fluxo específico. A cobrança do ajuste
        proporcional é feita imediatamente (proration_behavior=always_invoice)
        no momento em que o cliente confirma a troca.
        """
        info = cls._get_enterprise_price_and_product()
        price_id = info["price_id"]
        product_id = info["product_id"]

        existing = cls._find_enterprise_portal_configuration(price_id)
        if existing:
            return existing

        created = stripe.billing_portal.Configuration.create(
            business_profile={"headline": "Atualização para o plano Enterprise"},
            features={
                "invoice_history": {"enabled": True},
                # O Stripe exige payment_method_update habilitado sempre que
                # subscription_update está habilitado (a troca pode precisar
                # de confirmação/SCA sobre o método de pagamento do cliente).
                "payment_method_update": {"enabled": True},
                "subscription_update": {
                    "enabled": True,
                    "default_allowed_updates": ["price"],
                    "proration_behavior": "always_invoice",
                    "products": [{"product": product_id, "prices": [price_id]}],
                },
            },
            metadata={
                cls.ENTERPRISE_PORTAL_CONFIG_METADATA_KEY: cls.ENTERPRISE_PORTAL_CONFIG_METADATA_VALUE,
            },
        )
        return created["id"]

    @classmethod
    def create_enterprise_upgrade_portal_session(
        cls,
        customer_id: str,
        subscription_id: str,
        return_url: str,
    ) -> stripe.billing_portal.Session:
        """
        Cria uma sessão do Portal de Cobrança já apontada para a troca da
        subscription informada para o Price Enterprise.

        O próprio cliente abre o link e confirma a troca; é só nesse momento
        que o Stripe cobra o ajuste proporcional (imediatamente, pois a
        Portal Configuration usada aqui está com always_invoice).
        """
        configuration_id = cls.get_or_create_enterprise_portal_configuration()
        return stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=return_url,
            configuration=configuration_id,
            flow_data={
                "type": "subscription_update",
                "subscription_update": {"subscription": subscription_id},
            },
        )

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
            new_plan: Novo plano (starter, pro, advanced, enterprise)
            
        Returns:
            Subscription atualizada
            
        Raises:
            ValueError: Se o plano for inválido ou sem Price configurado
        """
        price_id = cls.PLAN_PRICE_MAP.get(new_plan)
        if not price_id:
            raise ValueError(
                f"Plano '{new_plan}' não possui Price configurado no Stripe"
            )
        
        # Recuperar subscription atual
        subscription = stripe.Subscription.retrieve(subscription_id)

        items = (subscription.get("items", {}) or {}).get("data", [])
        if not items:
            raise ValueError(
                f"Subscription '{subscription_id}' não possui itens para atualizar"
            )
        
        # Substitui o item existente: mantém a mesma subscription e gera proration
        return stripe.Subscription.modify(
            subscription_id,
            items=[{
                "id": items[0]["id"],
                "price": price_id,
            }],
            proration_behavior="create_prorations",
            metadata={
                **(subscription.get("metadata", {}) or {}),
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
    def _map_price_to_plan(cls, price_id: Optional[str]) -> Optional[str]:
        """
        Inverte o mapa de prices para plano.

        Retorna None quando o Price é desconhecido, para que o chamador possa
        preservar o plano atual em vez de rebaixar a organização por engano.
        """
        if not price_id:
            return None
        for plan, pid in cls.PLAN_PRICE_MAP.items():
            if pid and pid == price_id:
                return plan
        return None

    @classmethod
    def extract_subscription_data(cls, subscription: stripe.Subscription) -> Dict[str, Any]:
        """
        Extrai dados relevantes de uma subscription para persistir no banco.
        
        Args:
            subscription: Objeto Subscription do Stripe
            
        Returns:
            Dicionário com dados da subscription. A chave "plan" pode vir como
            None quando o Price da assinatura não é reconhecido; nesse caso o
            chamador deve preservar o plano já gravado no banco.
        """
        # Alguns eventos (ex.: created) podem não trazer todos os campos.
        # Usamos .get e fallback no item 0.
        # NOTE: StripeObject se comporta como dict.
        current_period_end = subscription.get("current_period_end")
        if not current_period_end:
            try:
                items = subscription.get("items", {}).get("data", [])
                if items:
                    current_period_end = items[0].get("current_period_end")
            except Exception:
                current_period_end = None
        # Fallback: se ainda não houver, mantém None

        # Plano: o Price do item 0 é a fonte prioritária, pois reflete a
        # assinatura de fato mesmo quando o cliente troca de plano fora do
        # nosso backend (ex.: self-service no Portal de Cobrança, que nunca
        # escreve em metadata.plan). metadata.plan só é usado como fallback
        # quando o Price não é reconhecido, e apenas se contiver um plano
        # válido — evitando tanto plano desatualizado quanto downgrade
        # silencioso para um Price desconhecido.
        price_id = None
        try:
            items = subscription.get("items", {}).get("data", [])
            if items:
                price_id = (items[0].get("price", {}) or {}).get("id")
        except Exception:
            price_id = None

        plan_name = cls._map_price_to_plan(price_id)
        if not plan_name:
            meta_plan = (subscription.get("metadata", {}) or {}).get("plan")
            if meta_plan in cls.PLAN_PRICE_MAP or meta_plan in cls.FREE_PLANS:
                plan_name = meta_plan

        # Default payment method pode vir como None em created
        default_pm = subscription.get("default_payment_method")
        return {
            "stripe_subscription_id": subscription.get("id"),
            "subscription_status": subscription.get("status"),
            "current_period_end": datetime.fromtimestamp(current_period_end) if current_period_end else None,
            "plan": plan_name,
            "default_payment_method": default_pm,
        }

