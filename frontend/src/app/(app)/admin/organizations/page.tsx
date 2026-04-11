"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  adminListOrganizations,
  adminUpdateOrganization,
  type AdminOrganizationItem,
  ApiError,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PLANS = ["basic", "starter", "pro", "advanced"] as const;

export default function AdminOrganizationsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [orgs, setOrgs] = useState<AdminOrganizationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editOrg, setEditOrg] = useState<AdminOrganizationItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editPlan, setEditPlan] = useState("");
  const [editStripeCustomerId, setEditStripeCustomerId] = useState("");
  const [editStripeSubId, setEditStripeSubId] = useState("");
  const [editSubStatus, setEditSubStatus] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState("");
  const [saving, setSaving] = useState(false);

  const perPage = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminListOrganizations({ page, per_page: perPage, q: search || undefined });
      setOrgs(data.items);
      setTotal(data.total);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail || err.message);
        if (err.status === 403) router.push("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, router]);

  useEffect(() => { load(); }, [load]);

  if (user?.role !== "admin") return null;

  const totalPages = Math.ceil(total / perPage);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const openEdit = (o: AdminOrganizationItem) => {
    setEditOrg(o);
    setEditName(o.name);
    setEditPlan(o.plan);
    setEditStripeCustomerId(o.stripe_customer_id ?? "");
    setEditStripeSubId(o.stripe_subscription_id ?? "");
    setEditSubStatus(o.subscription_status ?? "");
    setEditPaymentMethod(o.default_payment_method ?? "");
  };

  const handleSave = async () => {
    if (!editOrg) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      if (editName !== editOrg.name) payload.name = editName;
      if (editPlan !== editOrg.plan) payload.plan = editPlan;
      if (editStripeCustomerId !== (editOrg.stripe_customer_id ?? ""))
        payload.stripe_customer_id = editStripeCustomerId || null;
      if (editStripeSubId !== (editOrg.stripe_subscription_id ?? ""))
        payload.stripe_subscription_id = editStripeSubId || null;
      if (editSubStatus !== (editOrg.subscription_status ?? ""))
        payload.subscription_status = editSubStatus || null;
      if (editPaymentMethod !== (editOrg.default_payment_method ?? ""))
        payload.default_payment_method = editPaymentMethod || null;

      if (Object.keys(payload).length === 0) { setEditOrg(null); return; }
      await adminUpdateOrganization(editOrg.id, payload);
      setEditOrg(null);
      load();
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail || err.message);
    } finally {
      setSaving(false);
    }
  };

  const planColor = (plan: string) => {
    switch (plan) {
      case "basic": return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
      case "starter": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "pro": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "advanced": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
      default: return "";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
          Organizações
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Gerenciar todas as organizações ({total})
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <Input
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" variant="secondary">Buscar</Button>
      </form>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="pt-4">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-zinc-500">Carregando...</p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Organizações</CardTitle>
            <CardDescription>Página {page} de {totalPages || 1}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-zinc-500 dark:text-zinc-400">
                    <th className="pb-2 pr-4">ID</th>
                    <th className="pb-2 pr-4">Nome</th>
                    <th className="pb-2 pr-4">Plano</th>
                    <th className="pb-2 pr-4">Stripe</th>
                    <th className="pb-2 pr-4">Status Assinatura</th>
                    <th className="pb-2 pr-4">Criada em</th>
                    <th className="pb-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {orgs.map((o) => (
                    <tr key={o.id} className="border-b last:border-0 dark:border-zinc-800">
                      <td className="py-3 pr-4 font-mono text-xs">{o.id}</td>
                      <td className="py-3 pr-4 font-medium">{o.name}</td>
                      <td className="py-3 pr-4">
                        <Badge className={planColor(o.plan)}>{o.plan}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-xs text-zinc-500 font-mono truncate max-w-[120px]">
                        {o.stripe_customer_id ?? "—"}
                      </td>
                      <td className="py-3 pr-4">
                        {o.subscription_status ? (
                          <Badge variant={o.subscription_status === "active" ? "default" : "destructive"}>
                            {o.subscription_status}
                          </Badge>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-zinc-500 text-xs">
                        {new Date(o.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-3">
                        <Button size="sm" variant="outline" onClick={() => openEdit(o)}>
                          Editar
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {orgs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-400">
                        Nenhuma organização encontrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <span className="text-sm text-zinc-500">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Próxima
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editOrg} onOpenChange={(open) => !open && setEditOrg(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Organização</DialogTitle>
            <DialogDescription>ID {editOrg?.id}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Plano</label>
              <select
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                value={editPlan}
                onChange={(e) => setEditPlan(e.target.value)}
              >
                {PLANS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Stripe Customer ID</label>
              <Input value={editStripeCustomerId} onChange={(e) => setEditStripeCustomerId(e.target.value)} className="mt-1 font-mono text-xs" />
            </div>
            <div>
              <label className="text-sm font-medium">Stripe Subscription ID</label>
              <Input value={editStripeSubId} onChange={(e) => setEditStripeSubId(e.target.value)} className="mt-1 font-mono text-xs" />
            </div>
            <div>
              <label className="text-sm font-medium">Status da Assinatura</label>
              <Input value={editSubStatus} onChange={(e) => setEditSubStatus(e.target.value)} className="mt-1" placeholder="active, past_due, canceled..." />
            </div>
            <div>
              <label className="text-sm font-medium">Default Payment Method</label>
              <Input value={editPaymentMethod} onChange={(e) => setEditPaymentMethod(e.target.value)} className="mt-1 font-mono text-xs" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditOrg(null)} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
