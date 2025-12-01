"use client";

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

// Importação dos dados mockados
import {
  currentSubscription,
  paymentMethods,
  invoices,
  plans,
} from "@/mocks/billing";

export default function BillingPage() {
  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

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
            <Badge variant="default">
              {currentSubscription.status === "active" ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-zinc-500">Plano</p>
              <p className="text-2xl font-bold">{currentSubscription.plan}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Valor Mensal</p>
              <p className="text-2xl font-bold">
                {formatCurrency(currentSubscription.price)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Próxima Cobrança</p>
              <p className="text-2xl font-bold">
                {new Date(currentSubscription.nextBillingDate).toLocaleDateString(
                  "pt-BR"
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planos Disponíveis */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-white">
          Planos Disponíveis
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={plan.current ? "border-zinc-900 dark:border-white" : ""}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.current && <Badge>Atual</Badge>}
                </div>
                <CardDescription>
                  {plan.price ? (
                    <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                      {formatCurrency(plan.price)}
                      <span className="text-sm font-normal text-zinc-500">
                        /mês
                      </span>
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
                  variant={plan.current ? "outline" : "default"}
                  disabled={plan.current}
                >
                  {plan.current
                    ? "Plano Atual"
                    : plan.price
                    ? "Alterar Plano"
                    : "Falar com Vendas"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Métodos de Pagamento */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Métodos de Pagamento</CardTitle>
              <CardDescription>
                Cartões cadastrados para cobrança
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              Adicionar Cartão
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
                  <div className="flex h-10 w-14 items-center justify-center rounded bg-zinc-100 text-xs font-medium dark:bg-zinc-800">
                    {method.brand}
                  </div>
                  <div>
                    <p className="font-medium">
                      •••• •••• •••• {method.last4}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {method.type === "credit_card" ? "Cartão de Crédito" : "PIX"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {method.isDefault && (
                    <Badge variant="outline">Padrão</Badge>
                  )}
                  <Button variant="ghost" size="sm">
                    Remover
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Faturas */}
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
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    {new Date(invoice.date).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>{invoice.description}</TableCell>
                  <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        invoice.status === "paid"
                          ? "default"
                          : invoice.status === "pending"
                          ? "outline"
                          : "destructive"
                      }
                    >
                      {invoice.status === "paid"
                        ? "Pago"
                        : invoice.status === "pending"
                        ? "Pendente"
                        : "Falhou"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
