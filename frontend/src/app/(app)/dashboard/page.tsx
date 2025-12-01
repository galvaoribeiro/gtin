"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Importação dos dados mockados
import {
  currentPlan,
  usageToday,
  usageLast7Days,
  accountStatus,
} from "@/mocks/usage";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Visão geral do seu uso da plataforma
        </p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Card Plano Atual */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Plano Atual</CardDescription>
            <CardTitle className="text-2xl">{currentPlan.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p>Limite: {currentPlan.dailyLimit} consultas/dia</p>
              <p>Rate: {currentPlan.rateLimit}</p>
            </div>
          </CardContent>
        </Card>

        {/* Card Uso Hoje */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Consultas Hoje</CardDescription>
            <CardTitle className="text-2xl">
              {usageToday.consultas}{" "}
              <span className="text-base font-normal text-zinc-500">
                / {usageToday.limite}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
              <div
                className="h-2 rounded-full bg-zinc-900 dark:bg-white"
                style={{ width: `${usageToday.percentual}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {usageToday.percentual}% do limite diário
            </p>
          </CardContent>
        </Card>

        {/* Card Status da Conta */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Status da Conta</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Badge
                variant={
                  accountStatus.status === "active" ? "default" : "destructive"
                }
              >
                {accountStatus.status === "active" ? "Ativa" : "Inativa"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p>
                Membro desde:{" "}
                {new Date(accountStatus.memberSince).toLocaleDateString("pt-BR")}
              </p>
              <p>
                Próxima cobrança:{" "}
                {new Date(accountStatus.nextBillingDate).toLocaleDateString(
                  "pt-BR"
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Uso */}
      <Card>
        <CardHeader>
          <CardTitle>Uso nos Últimos 7 Dias</CardTitle>
          <CardDescription>
            Quantidade de consultas realizadas por dia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={usageLast7Days}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                <XAxis
                  dataKey="dia"
                  className="text-xs"
                  tick={{ fill: "currentColor" }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "currentColor" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="consultas"
                  stroke="#18181b"
                  strokeWidth={2}
                  dot={{ fill: "#18181b", strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
