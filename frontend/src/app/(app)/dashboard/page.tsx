"use client";

import { useState, useEffect } from "react";
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
  LineChart,
  Line,
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

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<UsageSummaryResponse | null>(null);
  const [dailySeries, setDailySeries] = useState<DailySeriesResponse | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Primeiro carregar usuário para verificar autenticação
      let userData: UserData;
      try {
        userData = await getCurrentUser();
        setUser(userData);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.push("/login");
          return;
        }
        throw err;
      }

      // Depois carregar métricas (podem estar vazias, não é erro)
      try {
        const [summaryData, dailyData] = await Promise.all([
          getUsageSummary(7),
          getUsageDaily(),
        ]);
        setSummary(summaryData);
        setDailySeries(dailyData);
      } catch (metricsErr) {
        // Métricas podem falhar se não houver dados, continuar mesmo assim
        console.error("Erro ao carregar métricas:", metricsErr);
        // Definir valores vazios
        setSummary(null);
        setDailySeries(null);
      }
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
      if (err instanceof ApiError) {
        if (err.status === 401) {
          router.push("/login");
          return;
        }
        setError(err.detail || err.message);
      } else {
        setError("Erro ao carregar dados do dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  // Derivar uso de hoje do último dia da série
  const getUsageToday = () => {
    if (!dailySeries || dailySeries.series.length === 0) {
      return { consultas: 0, limite: 1000, percentual: 0 };
    }
    // Pegar o último dia (mais recente)
    const today = dailySeries.series[dailySeries.series.length - 1];
    const limite = 1000; // TODO: pegar do plano da organização
    const consultas = today.total_count;
    return {
      consultas,
      limite,
      percentual: limite > 0 ? Math.round((consultas / limite) * 100) : 0,
    };
  };

  // Formatar série para o gráfico (últimos 7 dias)
  const getChartData = () => {
    if (!dailySeries) return [];
    
    const dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    
    // Pegar os últimos 7 dias
    const last7 = dailySeries.series.slice(-7);
    
    return last7.map((item) => {
      const date = new Date(item.date + "T12:00:00"); // Adiciona horário para evitar problemas de timezone
      return {
        dia: dias[date.getDay()],
        consultas: item.total_count,
        sucesso: item.success_count,
        erro: item.error_count,
      };
    });
  };

  const usageToday = getUsageToday();
  const chartData = getChartData();

  // Placeholder para plano atual (TODO: integrar com backend quando disponível)
  const currentPlan = {
    name: "Pro",
    dailyLimit: 1000,
    rateLimit: "30 req/min",
  };

  if (loading) {
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
            Dashboard
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Visão geral do seu uso da plataforma
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
          Dashboard
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Visão geral do seu uso da plataforma
          {user && ` • ${user.organization_name || "Sua organização"}`}
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
              <p>Limite: {currentPlan.dailyLimit.toLocaleString()} consultas/dia</p>
              <p>Rate: {currentPlan.rateLimit}</p>
            </div>
          </CardContent>
        </Card>

        {/* Card Uso Hoje */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Consultas Hoje</CardDescription>
            <CardTitle className="text-2xl">
              {usageToday.consultas.toLocaleString()}{" "}
              <span className="text-base font-normal text-zinc-500">
                / {usageToday.limite.toLocaleString()}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
              <div
                className="h-2 rounded-full bg-zinc-900 dark:bg-white"
                style={{ width: `${Math.min(usageToday.percentual, 100)}%` }}
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
              <Badge variant="default">Ativa</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              {user && (
                <p>
                  Membro desde:{" "}
                  {new Date(user.created_at).toLocaleDateString("pt-BR")}
                </p>
              )}
              {summary && (
                <p>
                  Total 7 dias: {summary.total_calls.toLocaleString()} consultas
                </p>
              )}
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
            {summary && (
              <span className="ml-2">
                (Total: {summary.total_calls.toLocaleString()} • 
                Sucesso: {summary.total_success.toLocaleString()} • 
                Erro: {summary.total_error.toLocaleString()})
              </span>
            )}
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
                <LineChart data={chartData}>
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
                    formatter={(value: number, name: string) => {
                      const labels: Record<string, string> = {
                        consultas: "Total",
                        sucesso: "Sucesso",
                        erro: "Erro",
                      };
                      return [value.toLocaleString(), labels[name] || name];
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
