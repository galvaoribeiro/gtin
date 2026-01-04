"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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

import {
  getUsageSummary,
  getUsageDaily,
  getCurrentUser,
  ApiError,
  type UsageSummaryResponse,
  type DailySeriesResponse,
  type UserData,
} from "@/lib/api";

export default function UsagePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<UsageSummaryResponse | null>(null);
  const [dailySeries, setDailySeries] = useState<DailySeriesResponse | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const router = useRouter();
  
  // Refs para evitar chamadas duplicadas e cleanup
  const isLoadingRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Marcar como montado
    isMountedRef.current = true;
    
    loadData();
    
    // Cleanup: marcar como desmontado
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadData = async () => {
    // Evitar chamadas duplicadas
    if (isLoadingRef.current) {
      return;
    }
    
    isLoadingRef.current = true;
    
    try {
      setLoading(true);
      setError(null);

      // Carregar resumo (30 dias), série diária e usuário em paralelo
      const [summaryData, dailyData, userData] = await Promise.all([
        getUsageSummary(30),
        getUsageDaily(), // Últimos 30 dias por default
        getCurrentUser(),
      ]);

      // Só atualizar estado se ainda estiver montado
      if (isMountedRef.current) {
        setSummary(summaryData);
        setDailySeries(dailyData);
        setUser(userData);
      }
    } catch (err) {
      console.error("Erro ao carregar dados de uso:", err);
      
      // Só atualizar estado se ainda estiver montado
      if (!isMountedRef.current) return;
      
      if (err instanceof ApiError) {
        if (err.status === 401) {
          router.push("/login");
          return;
        }
        setError(err.detail || err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro ao carregar dados de uso");
      }
    } finally {
      isLoadingRef.current = false;
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const getPlanLimits = (plan: string | null | undefined) => {
    const normalized = plan || "basic";
    switch (normalized) {
      case "starter":
        return { isBasic: false, monthlyLimit: 5000 };
      case "pro":
        return { isBasic: false, monthlyLimit: 10000 };
      case "advanced":
        return { isBasic: false, monthlyLimit: 20000 };
      default:
        return { isBasic: true, monthlyLimit: 0 };
    }
  };

  const { isBasic, monthlyLimit } = getPlanLimits(user?.plan);

  // Calcular estatísticas do mês (usando série diária carregada)
  const getMonthStats = () => {
    if (!dailySeries || dailySeries.series.length === 0) {
      return {
        total: 0,
        average: 0,
        peak: 0,
        peakDate: null as string | null,
      };
    }

    const series = dailySeries.series;
    let total = 0;
    let peak = 0;
    let peakDate: string | null = null;

    for (const day of series) {
      total += day.total_count;
      if (day.total_count > peak) {
        peak = day.total_count;
        peakDate = day.date;
      }
    }

    const average = series.length > 0 ? Math.round(total / series.length) : 0;

    return { total, average, peak, peakDate };
  };

  // Formatar série para o gráfico (últimos 14 dias)
  const getChartData = () => {
    if (!dailySeries) return [];
    
    // Pegar os últimos 14 dias
    const last14 = dailySeries.series.slice(-14);
    
    return last14.map((item) => ({
      dia: new Date(item.date + "T12:00:00").toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      consultas: item.total_count,
      sucesso: item.success_count,
      erro: item.error_count,
    }));
  };

  const monthStats = getMonthStats();
  const chartData = getChartData();

  const monthlyUsage = monthStats.total;
  const monthlyPercent = monthlyLimit
    ? Math.min(100, Math.round((monthlyUsage / monthlyLimit) * 100))
    : 0;

  if (loading) {
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
        <div className="flex items-center justify-center py-12">
          <p className="text-zinc-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
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
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-800 dark:text-red-200">
              Erro ao carregar dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Últimos 30 Dias</CardDescription>
            <CardTitle className="text-2xl">
              {monthStats.total.toLocaleString()}
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
            <CardDescription>{isBasic ? "Média Diária" : "Média Diária (30d)"}</CardDescription>
            <CardTitle className="text-2xl">
              {monthStats.average.toLocaleString()}
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
            <CardDescription>Pico do Período</CardDescription>
            <CardTitle className="text-2xl">
              {monthStats.peak.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {monthStats.peakDate
                ? `em ${new Date(monthStats.peakDate + "T12:00:00").toLocaleDateString("pt-BR")}`
                : "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Limite do Plano</CardDescription>
            <CardTitle className="text-2xl">
              {isBasic
                ? "Sem acesso à API"
                : monthlyLimit
                ? `${monthlyLimit.toLocaleString()} / mês`
                : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {isBasic
                ? "Plano Basic não inclui API keys."
                : "Aplicado mensalmente por organização."}
            </p>
            {!isBasic && monthlyLimit ? (
              <div className="mt-2 flex items-center gap-2">
                <div className="h-2 w-24 rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <div
                    className="h-2 rounded-full bg-zinc-900 dark:bg-white"
                    style={{ width: `${monthlyPercent}%` }}
                  />
                </div>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {monthlyPercent}% usado (30d)
                </span>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Taxa de Sucesso</CardDescription>
            <CardTitle className="text-2xl">
              <Badge variant="default" className="text-lg">
                {summary && summary.total_calls > 0
                  ? `${Math.round((summary.total_success / summary.total_calls) * 100)}%`
                  : "—"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {summary
                ? `${summary.total_success.toLocaleString()} sucesso / ${summary.total_error.toLocaleString()} erro`
                : "—"}
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
          {chartData.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center">
              <p className="text-zinc-500">Nenhum dado de uso encontrado</p>
            </div>
          ) : (
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
                    formatter={(value?: number, name?: string) => {
                      const labels: Record<string, string> = {
                        consultas: "Total",
                        sucesso: "Sucesso",
                        erro: "Erro",
                      };
                    
                      const formattedValue =
                        typeof value === "number" ? value.toLocaleString() : "";
                    
                      const label = name ? labels[name] ?? name : "";
                    
                      return [formattedValue, label];
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
          )}
        </CardContent>
      </Card>

      {/* Uso por API Key */}
      <Card>
        <CardHeader>
          <CardTitle>Uso por API Key</CardTitle>
          <CardDescription>
            Distribuição das chamadas por chave de API (últimos 30 dias)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!summary || summary.by_api_key.length === 0 ? (
            <p className="py-4 text-center text-zinc-500">
              Nenhuma API key com uso registrado
            </p>
          ) : (
            <div className="space-y-4">
              {summary.by_api_key.map((apiKey) => {
                const percentage = summary.total_calls > 0
                  ? Math.round((apiKey.total_calls / summary.total_calls) * 100)
                  : 0;
                return (
                  <div key={apiKey.api_key_id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {apiKey.api_key_name || `API Key #${apiKey.api_key_id}`}
                      </span>
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        {apiKey.total_calls.toLocaleString()} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
                      <div
                        className="h-2 rounded-full bg-zinc-900 dark:bg-white"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>Sucesso: {apiKey.total_success.toLocaleString()}</span>
                      <span>Erro: {apiKey.total_error.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela de Histórico */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico Detalhado</CardTitle>
          <CardDescription>
            Consumo diário dos últimos 30 dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!dailySeries || dailySeries.series.length === 0 ? (
            <p className="py-4 text-center text-zinc-500">
              Nenhum dado de uso encontrado
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Consultas</TableHead>
                  <TableHead>Sucesso</TableHead>
                  <TableHead>Erro</TableHead>
                  <TableHead>Limite</TableHead>
                  <TableHead>Uso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Mostrar em ordem decrescente (mais recente primeiro) */}
                {[...dailySeries.series].reverse().map((day) => {
                  const percentage = 0;
                  return (
                    <TableRow key={day.date}>
                      <TableCell>
                        {new Date(day.date + "T12:00:00").toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>{day.total_count.toLocaleString()}</TableCell>
                      <TableCell className="text-green-600 dark:text-green-400">
                        {day.success_count.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-red-600 dark:text-red-400">
                        {day.error_count.toLocaleString()}
                      </TableCell>
                      <TableCell>—</TableCell>
                      <TableCell>
                        <span className="text-sm text-zinc-500">—</span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
