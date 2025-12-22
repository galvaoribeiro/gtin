"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getBillingData,
  createCheckoutSession,
  createBillingPortalSession,
  ApiError,
} from "@/lib/api";

// Definição dos planos disponíveis
const PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: 0,
    features: [
      "15 consultas/dia",
      "Acesso público limitado",
      "Suporte via documentação",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: 249.90,
    features: [
      "1.000 consultas/dia",
      "API Key dedicada",
      "10 req/min",
      "Suporte por email",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 399.90,
    features: [
      "5.000 consultas/dia",
      "Batch até 100 GTINs",
      "30 req/min",
      "Suporte prioritário",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 899.90,
    features: [
      "50.000 consultas/dia",
      "Bulk assíncrono",
      "IP allowlist",
      "SLA garantido",
      "Gerente dedicado",
    ],
  },
];

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingData, setBillingData] = useState<any>(null);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  // Carregar dados de billing
  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBillingData();
      setBillingData(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Erro ao carregar dados de cobrança");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePlan = async (planId: string) => {
    // Plano basic é grátis, não precisa checkout
    if (planId === "basic") {
      alert("Para voltar ao plano Basic, cancele sua assinatura no portal de cobrança.");
      return;
    }

    try {
      setProcessingPlan(planId);
      const session = await createCheckoutSession(planId);
      // Redirecionar para o checkout do Stripe
      window.location.href = session.url;
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.message);
      } else {
        alert("Erro ao iniciar checkout");
      }
      setProcessingPlan(null);
    }
  };

  const handleManageBilling = async () => {
    try {
      const portal = await createBillingPortalSession();
      // Redirecionar para o portal de cobrança do Stripe
      window.location.href = portal.url;
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.message);
      } else {
        alert("Erro ao abrir portal de cobrança");
      }
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            Cobrança
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Carregando dados...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            Cobrança
          </h1>
          <p className="mt-1 text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  const subscription = billingData?.subscription;
  const invoices = billingData?.invoices || [];
  const paymentMethods = billingData?.payment_methods || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
          Cobrança
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Gerencie sua assinatura e métodos de pagamento
        </p>
      </div>

      {/* Assinatura Atual */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Assinatura Atual</CardTitle>
              <CardDescription>
                Detalhes do seu plano e próxima cobrança
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {subscription?.status && (
                <Badge variant={subscription.status === "active" ? "default" : "outline"}>
                  {subscription.status === "active" ? "Ativo" : subscription.status}
                </Badge>
              )}
              {subscription?.cancel_at_period_end && (
                <Badge variant="destructive">Cancelamento agendado</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-zinc-500">Plano</p>
              <p className="text-2xl font-bold capitalize">
                {subscription?.plan || "Basic"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Limite Diário</p>
              <p className="text-2xl font-bold">
                {subscription?.daily_limit?.toLocaleString("pt-BR") || "15"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Próxima Cobrança</p>
              <p className="text-2xl font-bold">
                {subscription?.current_period_end
                  ? new Date(subscription.current_period_end).toLocaleDateString("pt-BR")
                  : "N/A"}
              </p>
            </div>
          </div>
          {subscription?.plan !== "basic" && (
            <div className="mt-4">
              <Button onClick={handleManageBilling} variant="outline">
                Gerenciar Assinatura
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Planos Disponíveis */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-white">
          Planos Disponíveis
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const isCurrent = subscription?.plan === plan.id;
            return (
              <Card
                key={plan.id}
                className={isCurrent ? "border-zinc-900 dark:border-white" : ""}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{plan.name}</CardTitle>
                    {isCurrent && <Badge>Atual</Badge>}
                  </div>
                  <CardDescription>
                    {plan.price > 0 ? (
                      <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                        {formatCurrency(plan.price)}
                        <span className="text-sm font-normal text-zinc-500">
                          /mês
                        </span>
                      </span>
                    ) : plan.id === "basic" ? (
                      <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                        Grátis
                      </span>
                    ) : (
                      <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                        Sob consulta
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400"
                      >
                        <span className="text-green-500">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-4 w-full"
                    variant={isCurrent ? "outline" : "default"}
                    disabled={isCurrent || processingPlan === plan.id}
                    onClick={() => handleUpgradePlan(plan.id)}
                  >
                    {processingPlan === plan.id
                      ? "Processando..."
                      : isCurrent
                      ? "Plano Atual"
                      : "Alterar Plano"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Métodos de Pagamento */}
      {paymentMethods.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Métodos de Pagamento</CardTitle>
                <CardDescription>
                  Cartões cadastrados para cobrança
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleManageBilling}>
                Gerenciar Cartões
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-14 items-center justify-center rounded bg-zinc-100 text-xs font-medium uppercase dark:bg-zinc-800">
                      {method.brand}
                    </div>
                    <div>
                      <p className="font-medium">
                        •••• •••• •••• {method.last4}
                      </p>
                      <p className="text-sm text-zinc-500">
                        Validade: {method.exp_month}/{method.exp_year}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {method.is_default && (
                      <Badge variant="outline">Padrão</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Faturas */}
      {invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Faturas</CardTitle>
            <CardDescription>
              Suas últimas faturas e pagamentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      {new Date(invoice.date).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          invoice.status === "paid"
                            ? "default"
                            : invoice.status === "open"
                            ? "outline"
                            : "destructive"
                        }
                      >
                        {invoice.status === "paid"
                          ? "Pago"
                          : invoice.status === "open"
                          ? "Aberto"
                          : invoice.status === "draft"
                          ? "Rascunho"
                          : "Falhou"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {invoice.invoice_pdf && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(invoice.invoice_pdf!, "_blank")}
                        >
                          Download PDF
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
