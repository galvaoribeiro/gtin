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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Importação dos dados mockados
import {
  usageHistory,
  usageByEndpoint,
  usageSummary,
} from "@/mocks/usageHistory";

export default function UsagePage() {
  // Pegar últimos 14 dias para o gráfico
  const chartData = usageHistory.slice(0, 14).reverse().map((item) => ({
    dia: new Date(item.date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    }),
    consultas: item.consultas,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
          Uso da API
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Acompanhe o consumo detalhado da sua conta
        </p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Este Mês</CardDescription>
            <CardTitle className="text-2xl">
              {usageSummary.thisMonth.total.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              consultas realizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Média Diária</CardDescription>
            <CardTitle className="text-2xl">
              {usageSummary.thisMonth.average}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              consultas/dia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pico do Mês</CardDescription>
            <CardTitle className="text-2xl">
              {usageSummary.thisMonth.peak}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              em {new Date(usageSummary.thisMonth.peakDate).toLocaleDateString("pt-BR")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>vs. Mês Anterior</CardDescription>
            <CardTitle className="text-2xl">
              <Badge variant="default" className="text-lg">
                {usageSummary.growth}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              crescimento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Uso */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Uso (14 dias)</CardTitle>
          <CardDescription>
            Quantidade de consultas realizadas por dia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
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
                <Bar
                  dataKey="consultas"
                  fill="#18181b"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Uso por Endpoint */}
      <Card>
        <CardHeader>
          <CardTitle>Uso por Endpoint</CardTitle>
          <CardDescription>
            Distribuição das chamadas por tipo de requisição
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {usageByEndpoint.map((endpoint) => (
              <div key={endpoint.endpoint} className="space-y-2">
                <div className="flex items-center justify-between">
                  <code className="text-sm font-medium">{endpoint.endpoint}</code>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {endpoint.count.toLocaleString()} ({endpoint.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <div
                    className="h-2 rounded-full bg-zinc-900 dark:bg-white"
                    style={{ width: `${endpoint.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Histórico */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico Detalhado</CardTitle>
          <CardDescription>
            Consumo diário dos últimos dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Consultas</TableHead>
                <TableHead>Limite</TableHead>
                <TableHead>Uso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usageHistory.map((day) => {
                const percentage = Math.round((day.consultas / day.limite) * 100);
                return (
                  <TableRow key={day.date}>
                    <TableCell>
                      {new Date(day.date).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>{day.consultas.toLocaleString()}</TableCell>
                    <TableCell>{day.limite.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded-full bg-zinc-200 dark:bg-zinc-700">
                          <div
                            className="h-2 rounded-full bg-zinc-900 dark:bg-white"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">
                          {percentage}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
