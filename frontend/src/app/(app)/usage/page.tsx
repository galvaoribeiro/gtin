"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { PeriodToolbar } from "@/components/usage/period-toolbar";
import { useAuth } from "@/lib/auth-context";
import {
  getUsageSummary,
  getUsageDaily,
  ApiError,
  type UsageSummaryResponse,
  type DailySeriesResponse,
} from "@/lib/api";
import {
  formatChartTick,
  formatCompactCount,
  formatCount,
  formatFullDate,
  getPeriodForPreset,
  parseISODate,
  type UsagePeriod,
} from "@/lib/usage-period";
import { cn } from "@/lib/utils";

type GroupBy = "total" | "status" | "api_key";

const KEY_COLORS = [
  "#2dd4bf",
  "#93c5fd",
  "#3b82f6",
  "#c4b5fd",
  "#86efac",
  "#67e8f9",
  "#f9a8d4",
  "#fcd34d",
];

const GROUP_OPTIONS: { id: GroupBy; label: string }[] = [
  { id: "api_key", label: "Chave de acesso" },
  { id: "status", label: "Status" },
  { id: "total", label: "Total" },
];

function keySeriesId(apiKeyId: number) {
  return `key_${apiKeyId}`;
}

function UsageChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    color?: string;
    payload?: { date?: string };
  }>;
}) {
  if (!active || !payload?.length) return null;
  const date = payload[0]?.payload?.date;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-md dark:border-zinc-700 dark:bg-zinc-900">
      {date ? (
        <p className="mb-1.5 font-medium text-zinc-900 dark:text-zinc-100">
          {formatFullDate(date)}
        </p>
      ) : null}
      <div className="space-y-1">
        {[...payload].reverse().map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between gap-6"
          >
            <span className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
              <span
                className="size-2.5 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              {item.name}
            </span>
            <span className="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
              {formatCount(item.value ?? 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function UsagePage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<UsageSummaryResponse | null>(null);
  const [dailySeries, setDailySeries] = useState<DailySeriesResponse | null>(null);
  const [period, setPeriod] = useState<UsagePeriod>(() => getPeriodForPreset("7d"));
  const [groupBy, setGroupBy] = useState<GroupBy>("api_key");
  const [tablePage, setTablePage] = useState(1);
  const [tablePerPage, setTablePerPage] = useState(10);
  const { user } = useAuth();
  const router = useRouter();

  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const hasDataRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadData = useCallback(
    async (startDate: string, endDate: string) => {
      const requestId = ++requestIdRef.current;
      const isFirstLoad = !hasDataRef.current;

      try {
        if (isFirstLoad) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }
        setError(null);

        const [summaryData, dailyData] = await Promise.all([
          getUsageSummary(7, startDate, endDate),
          getUsageDaily(startDate, endDate),
        ]);

        if (!isMountedRef.current || requestId !== requestIdRef.current) return;

        setSummary(summaryData);
        setDailySeries(dailyData);
        hasDataRef.current = true;
      } catch (err) {
        console.error("Erro ao carregar dados de uso:", err);
        if (!isMountedRef.current || requestId !== requestIdRef.current) return;

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
        if (isMountedRef.current && requestId === requestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [router]
  );

  useEffect(() => {
    void loadData(period.start, period.end);
    setTablePage(1);
  }, [loadData, period.start, period.end]);

  const monthlyLimit = user?.monthly_limit ?? 0;

  const totals = useMemo(() => {
    if (!dailySeries) {
      return { total: 0, success: 0, error: 0, peak: 0, peakDate: null as string | null };
    }

    let total = 0;
    let success = 0;
    let error = 0;
    let peak = 0;
    let peakDate: string | null = null;

    for (const day of dailySeries.series) {
      const dayTotal = day.success_count + day.error_count;
      total += dayTotal;
      success += day.success_count;
      error += day.error_count;
      if (dayTotal > peak) {
        peak = dayTotal;
        peakDate = day.date;
      }
    }

    return { total, success, error, peak, peakDate };
  }, [dailySeries]);

  const apiKeySeries = dailySeries?.by_api_key ?? [];
  const effectiveGroupBy: GroupBy =
    groupBy === "api_key" && apiKeySeries.length === 0 ? "total" : groupBy;

  const chartSeries = useMemo(() => {
    if (effectiveGroupBy === "status") {
      return [
        { key: "sucesso", label: "Sucesso", color: "#2dd4bf" },
        { key: "erro", label: "Erro", color: "#93c5fd" },
      ];
    }
    if (effectiveGroupBy === "api_key") {
      return apiKeySeries.map((item, index) => ({
        key: keySeriesId(item.api_key_id),
        label: item.api_key_name || `Chave #${item.api_key_id}`,
        color: KEY_COLORS[index % KEY_COLORS.length],
      }));
    }
    return [{ key: "total", label: "Consultas", color: "#2dd4bf" }];
  }, [apiKeySeries, effectiveGroupBy]);

  const chartData = useMemo(() => {
    if (!dailySeries) return [];

    const days = dailySeries.series;
    if (effectiveGroupBy === "status") {
      let successAcc = 0;
      let errorAcc = 0;
      return days.map((day) => {
        successAcc += day.success_count;
        errorAcc += day.error_count;
        return {
          date: day.date,
          sucesso: successAcc,
          erro: errorAcc,
        };
      });
    }

    if (effectiveGroupBy === "api_key") {
      const running: Record<string, number> = {};
      for (const item of apiKeySeries) {
        running[keySeriesId(item.api_key_id)] = 0;
      }
      return days.map((day, index) => {
        const point: Record<string, string | number> = { date: day.date };
        for (const item of apiKeySeries) {
          const key = keySeriesId(item.api_key_id);
          const dayUsage = item.series[index];
          running[key] +=
            (dayUsage?.success_count ?? 0) + (dayUsage?.error_count ?? 0);
          point[key] = running[key];
        }
        return point;
      });
    }

    let totalAcc = 0;
    return days.map((day) => {
      totalAcc += day.success_count + day.error_count;
      return { date: day.date, total: totalAcc };
    });
  }, [apiKeySeries, dailySeries, effectiveGroupBy]);

  const historyRows = useMemo(() => {
    if (!dailySeries) return [];
    return [...dailySeries.series]
      .filter((day) => day.success_count + day.error_count > 0)
      .reverse();
  }, [dailySeries]);

  const historyTotal = historyRows.length;
  const historyPageRows = historyRows.slice(
    (tablePage - 1) * tablePerPage,
    tablePage * tablePerPage
  );

  const monthlyPercent =
    monthlyLimit && period.preset === "mtd"
      ? Math.min(100, Math.round((totals.success / monthlyLimit) * 100))
      : null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Uso</h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Acompanhe suas consultas e o consumo do plano
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <p className="text-zinc-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error && !summary && !dailySeries) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Uso</h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Acompanhe suas consultas e o consumo do plano
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
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Uso</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Acompanhe suas consultas e o consumo do plano
        </p>
      </div>

      <PeriodToolbar
        period={period}
        onChange={setPeriod}
        disabled={refreshing}
      />

      {error ? (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="pt-0">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </CardContent>
        </Card>
      ) : null}

      <div
        className={cn(
          "space-y-6 transition-opacity",
          refreshing && "pointer-events-none opacity-60"
        )}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="gap-2 py-5">
            <CardHeader className="pb-0">
              <CardDescription>Total de consultas</CardDescription>
              <CardTitle className="text-3xl font-semibold tracking-tight">
                {formatCompactCount(totals.total)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="gap-2 py-5">
            <CardHeader className="pb-0">
              <CardDescription>Com sucesso</CardDescription>
              <CardTitle className="text-3xl font-semibold tracking-tight">
                {formatCompactCount(totals.success)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="gap-2 py-5">
            <CardHeader className="pb-0">
              <CardDescription>Com erro</CardDescription>
              <CardTitle className="text-3xl font-semibold tracking-tight">
                {formatCompactCount(totals.error)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {monthlyLimit > 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Limite do plano: {formatCount(monthlyLimit)} consultas / mês
            {monthlyPercent != null ? ` · ${monthlyPercent}% usado neste mês` : null}
            {totals.peakDate
              ? ` · Pico de ${formatCount(totals.peak)} em ${parseISODate(
                  totals.peakDate
                ).toLocaleDateString("pt-BR")}`
              : null}
          </p>
        ) : null}

        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1.5">
              <CardTitle>Histórico de uso</CardTitle>
              <CardDescription>
                Uso acumulado por dia no período selecionado
              </CardDescription>
            </div>
            <label className="flex shrink-0 items-center gap-2 text-sm text-zinc-500">
              Agrupar por
              <select
                value={groupBy}
                onChange={(event) => setGroupBy(event.target.value as GroupBy)}
                className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              >
                {GROUP_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="flex h-80 items-center justify-center">
                <p className="text-zinc-500">Nenhum dado de uso encontrado</p>
              </div>
            ) : (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-zinc-200 dark:stroke-zinc-800"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value: string) =>
                        formatChartTick(value, chartData.length)
                      }
                      minTickGap={24}
                      tick={{ fill: "currentColor", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(value: number) => formatCompactCount(value)}
                      tick={{ fill: "currentColor", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      width={52}
                      domain={[0, "auto"]}
                    />
                    <Tooltip content={<UsageChartTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      iconType="square"
                      iconSize={10}
                      formatter={(value) => (
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">
                          {value}
                        </span>
                      )}
                    />
                    {chartSeries.map((item) => (
                      <Area
                        key={item.key}
                        type="linear"
                        dataKey={item.key}
                        name={item.label}
                        stackId="usage"
                        stroke={item.color}
                        fill={item.color}
                        fillOpacity={0.55}
                        strokeWidth={1.5}
                        dot={chartData.length <= 2}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Uso por chave de acesso</CardTitle>
            <CardDescription>
              Distribuição das consultas no período selecionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!summary || summary.by_api_key.length === 0 ? (
              <p className="py-4 text-center text-zinc-500">
                Nenhuma chave de acesso com uso registrado
              </p>
            ) : (
              <div className="space-y-4">
                {summary.by_api_key.map((apiKey) => {
                  const apiKeyTotal = apiKey.total_success + apiKey.total_error;
                  const summaryTotal = summary.total_success + summary.total_error;
                  const percentage =
                    summaryTotal > 0
                      ? Math.round((apiKeyTotal / summaryTotal) * 100)
                      : 0;
                  return (
                    <div key={apiKey.api_key_id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {apiKey.api_key_name || `Chave #${apiKey.api_key_id}`}
                        </span>
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">
                          {formatCount(apiKeyTotal)} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
                        <div
                          className="h-2 rounded-full bg-zinc-900 dark:bg-white"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-zinc-500">
                        <span>Sucesso: {formatCount(apiKey.total_success)}</span>
                        <span>Erro: {formatCount(apiKey.total_error)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico detalhado</CardTitle>
            <CardDescription>
              Consumo diário no período selecionado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {historyRows.length === 0 ? (
              <p className="py-4 text-center text-zinc-500">
                Nenhum dado de uso encontrado
              </p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Consultas</TableHead>
                      <TableHead>Sucesso</TableHead>
                      <TableHead>Erro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyPageRows.map((day) => {
                      const dayTotal = day.success_count + day.error_count;
                      return (
                        <TableRow key={day.date}>
                          <TableCell>
                            {parseISODate(day.date).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell>{formatCount(dayTotal)}</TableCell>
                          <TableCell className="text-emerald-600 dark:text-emerald-400">
                            {formatCount(day.success_count)}
                          </TableCell>
                          <TableCell className="text-red-600 dark:text-red-400">
                            {formatCount(day.error_count)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <TablePagination
                  page={tablePage}
                  perPage={tablePerPage}
                  total={historyTotal}
                  onPageChange={setTablePage}
                  onPerPageChange={(value) => {
                    setTablePerPage(value);
                    setTablePage(1);
                  }}
                  itemLabel={{ singular: "dia", plural: "dias" }}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
