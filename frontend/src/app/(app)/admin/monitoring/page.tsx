"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  adminGetMonitoring,
  ApiError,
  type AdminMonitoringResponse,
  type MonitoringStatus,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const REFRESH_INTERVAL_MS = 10_000;

const STATUS_LABEL: Record<MonitoringStatus, string> = {
  ok: "OK",
  warn: "Atenção",
  error: "Erro",
  disabled: "Desativado",
};

const STATUS_CLASS: Record<MonitoringStatus, string> = {
  ok: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  warn: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300",
  error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  disabled: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min ${s % 60}s`;
  return `${s}s`;
}

function pct(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 text-sm">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="text-right font-medium text-zinc-900 dark:text-white">{value}</span>
    </div>
  );
}

function BlockCard({
  title,
  description,
  status,
  error,
  children,
}: {
  title: string;
  description?: string;
  status: MonitoringStatus;
  error: string | null;
  children?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <Badge className={STATUS_CLASS[status]}>{STATUS_LABEL[status]}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="mb-2 rounded-md bg-red-50 p-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">{children}</div>
      </CardContent>
    </Card>
  );
}

function UsageBar({ ratio, status }: { ratio: number; status: MonitoringStatus }) {
  const color =
    status === "error" ? "bg-red-500" : status === "warn" ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
      <div
        className={`h-full ${color} transition-all`}
        style={{ width: `${Math.min(100, Math.round(ratio * 100))}%` }}
      />
    </div>
  );
}

export default function AdminMonitoringPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<AdminMonitoringResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await adminGetMonitoring());
      setError(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail || err.message);
        if (err.status === 403) router.push("/dashboard");
      } else {
        setError("Não foi possível carregar o monitoramento");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(load, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [autoRefresh, load]);

  if (user?.role !== "admin") return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Monitoramento</h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Status da aplicação e das dependências
            {data && ` · atualizado às ${new Date(data.generated_at).toLocaleTimeString("pt-BR")}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Atualizar a cada {REFRESH_INTERVAL_MS / 1000}s
          </label>
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="pt-4">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </CardContent>
        </Card>
      )}

      {!data && loading && <p className="text-zinc-500">Carregando...</p>}

      {data && (
        <div className="grid gap-4 lg:grid-cols-2">
          <BlockCard
            title="Pool de conexões"
            description="Pool da aplicação (SQLAlchemy), neste processo"
            status={data.pool.status}
            error={data.pool.error}
          >
            <UsageBar ratio={data.pool.data.usage_ratio} status={data.pool.status} />
            <Row
              label="Em uso agora"
              value={`${data.pool.data.checked_out} / ${data.pool.data.capacity} (${pct(data.pool.data.usage_ratio)})`}
            />
            <Row
              label="Pico desde o início do processo"
              value={`${data.pool.data.peak_checked_out} / ${data.pool.data.capacity} (${pct(data.pool.data.peak_ratio)})`}
            />
            <Row label="Livres no pool" value={data.pool.data.checked_in} />
            <Row
              label="Overflow em uso"
              value={`${data.pool.data.overflow_in_use} / ${data.pool.data.max_overflow}`}
            />
            <Row label="pool_size" value={data.pool.data.pool_size} />
            <Row label="Timeout de espera" value={`${data.pool.data.timeout_seconds}s`} />
            <Row label="Reciclagem" value={formatDuration(data.pool.data.recycle_seconds)} />
            <p className="pt-2 text-xs text-zinc-400">{data.pool.data.note}</p>
          </BlockCard>

          <BlockCard
            title="Conexões no Postgres"
            description="Visão do banco (pg_stat_activity)"
            status={data.db_connections.status}
            error={data.db_connections.error}
          >
            {data.db_connections.status !== "error" && (
              <>
                <Row label="Ativas" value={data.db_connections.data.active} />
                <Row label="Ociosas (idle)" value={data.db_connections.data.idle} />
                <Row
                  label="Idle in transaction"
                  value={data.db_connections.data.idle_in_transaction}
                />
                <Row
                  label="Total / max_connections"
                  value={`${data.db_connections.data.total} / ${data.db_connections.data.max_connections}`}
                />
                <Row
                  label="Conexão mais antiga"
                  value={formatDuration(data.db_connections.data.oldest_connection_seconds)}
                />
                {data.db_connections.data.idle_in_transaction > 0 && (
                  <Row
                    label="Idle in transaction mais antiga"
                    value={formatDuration(
                      data.db_connections.data.oldest_idle_in_transaction_seconds,
                    )}
                  />
                )}
                <p className="pt-2 text-xs text-zinc-400">
                  {data.db_connections.data.note} Conexões bem mais antigas que a reciclagem (
                  {formatDuration(data.db_connections.data.recycle_seconds)}) merecem atenção.
                </p>
              </>
            )}
          </BlockCard>

          <BlockCard
            title="PostgreSQL"
            description="Latência e configuração"
            status={data.postgres.status}
            error={data.postgres.error}
          >
            {data.postgres.status !== "error" && (
              <>
                <Row label="Latência (SELECT 1)" value={`${data.postgres.data.latency_ms} ms`} />
                <Row label="shared_buffers" value={data.postgres.data.shared_buffers ?? "—"} />
                <Row label="work_mem" value={data.postgres.data.work_mem ?? "—"} />
                <Row label="max_connections" value={data.postgres.data.max_connections ?? "—"} />
              </>
            )}
          </BlockCard>

          <BlockCard
            title="Redis"
            description="Usado pelo rate limit"
            status={data.redis.status}
            error={data.redis.error}
          >
            <Row label="Habilitado" value={data.redis.data.enabled ? "Sim" : "Não"} />
            <Row label="Conectado" value={data.redis.data.connected ? "Sim" : "Não"} />
            {data.redis.data.latency_ms != null && (
              <Row label="Latência (PING)" value={`${data.redis.data.latency_ms} ms`} />
            )}
            {data.redis.data.note && (
              <p className="pt-2 text-xs text-zinc-400">{data.redis.data.note}</p>
            )}
          </BlockCard>

          <BlockCard
            title="Stripe"
            description="Configuração (sem chamada à API)"
            status={data.stripe.status}
            error={data.stripe.error}
          >
            {Object.entries(data.stripe.data.configured ?? {}).map(([key, ok]) => (
              <Row
                key={key}
                label={key}
                value={
                  <span className={ok ? "text-emerald-600" : "text-red-600"}>
                    {ok ? "Configurado" : "Ausente"}
                  </span>
                }
              />
            ))}
          </BlockCard>

          <BlockCard
            title="Aplicação"
            description="Processo que respondeu a esta requisição"
            status={data.app.status}
            error={data.app.error}
          >
            <Row label="PID" value={data.app.data.pid} />
            <Row label="Uptime" value={formatDuration(data.app.data.uptime_seconds)} />
            <Row label="Python" value={data.app.data.python} />
            <Row label="WEB_CONCURRENCY" value={data.app.data.web_concurrency ?? "—"} />
            <p className="pt-2 text-xs text-zinc-400">
              Se o PID mudar entre atualizações, há mais de um worker e o pool mostrado é de apenas
              um deles.
            </p>
          </BlockCard>
        </div>
      )}
    </div>
  );
}
