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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { useAuth } from "@/lib/auth-context";
import {
  getUsageSummary,
  getUsageDaily,
  ApiError,
  type UsageSummaryResponse,
  type DailySeriesResponse,
} from "@/lib/api";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<UsageSummaryResponse | null>(null);
  const [dailySeries, setDailySeries] = useState<DailySeriesResponse | null>(null);
  const router = useRouter();
  
  // Usar user do auth-context em vez de buscar novamente
  const { user } = useAuth();
  
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

      // Carregar métricas (podem estar vazias, não é erro)
      const [summaryData, dailyData] = await Promise.all([
        getUsageSummary(7),
        getUsageDaily(),
      ]);
      
      // Só atualizar estado se ainda estiver montado
      if (isMountedRef.current) {
        setSummary(summaryData);
        setDailySeries(dailyData);
      }
    } catch (err) {
      console.error("Erro ao carregar métricas:", err);
      
      // Só atualizar estado se ainda estiver montado
      if (!isMountedRef.current) return;
      
      if (err instanceof ApiError) {
        if (err.status === 401) {
          router.push("/login");
          return;
        }
        setError(err.detail || err.message);
      } else {
        // Métricas podem falhar, não é crítico
        setSummary(null);
        setDailySeries(null);
      }
    } finally {
      isLoadingRef.current = false;
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const getPlanLimits = () => {
    const plan = user?.plan || "basic";
    switch (plan) {
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

  // Derivar uso exibido (sem API para basic; 7d para demais)
  const getUsageToday = () => {
    const { isBasic, monthlyLimit } = getPlanLimits();
    if (isBasic) {
      return {
        label: "Sem acesso à API",
        consultas: 0,
        limite: 0,
        percentual: 0,
        isBasic,
      };
    }
    const consumo = summary?.total_calls ?? 0; // últimos 7 dias
    const limite = monthlyLimit || 0;
    return {
      label: "Consumo (7 dias)",
      consultas: consumo,
      limite,
      percentual: limite > 0 ? Math.min(100, Math.round((consumo / limite) * 100)) : 0,
      isBasic,
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

  // Formatar nome do plano para exibição
  const getPlanDisplayName = (plan: string | null | undefined): string => {
    const planNames: Record<string, string> = {
      basic: "Basic",
      starter: "Starter",
      pro: "Pro",
      advanced: "Advanced",
    };
    return planNames[plan || "basic"] || plan || "Basic";
  };

  // Obter rate limit baseado no plano
  const getRateLimit = (plan: string | null | undefined): string => {
    const rateLimits: Record<string, string> = {
      basic: "5 req/min",
      starter: "10 req/min",
      pro: "30 req/min",
      advanced: "100 req/min",
    };
    return rateLimits[plan || "basic"] || "5 req/min";
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
            <CardTitle className="text-2xl">{getPlanDisplayName(user?.plan)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              {(() => {
                const { isBasic, monthlyLimit } = getPlanLimits();
                return isBasic ? (
                  <p>Limite: sem acesso à API (plano Basic)</p>
                ) : (
                  <p>
                    Limite: {monthlyLimit ? monthlyLimit.toLocaleString() : "—"} consultas/mês
                  </p>
                );
              })()}
              <p>Rate: {getRateLimit(user?.plan)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Card Uso Hoje */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{usageToday.label}</CardDescription>
            <CardTitle className="text-2xl">
              {usageToday.consultas.toLocaleString()}{" "}
              <span className="text-base font-normal text-zinc-500">
                / {usageToday.limite ? usageToday.limite.toLocaleString() : "—"}
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
              {usageToday.isBasic
                ? "Plano Basic não inclui API."
                : `${usageToday.percentual}% do limite mensal (base 7d)`}
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
