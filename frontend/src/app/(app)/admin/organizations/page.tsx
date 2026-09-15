"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  adminListOrganizations,
  adminProvisionEnterprise,
  adminUpdateOrganization,
  type AdminOrganizationItem,
  ApiError,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/ui/table-pagination";
import { SubscriptionStatusBadges } from "@/components/admin/subscription-status";
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

const PLANS = ["basic", "starter", "pro", "advanced", "enterprise"] as const;

const brlFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatCentsToBrl(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return brlFormatter.format(cents / 100);
}

export default function AdminOrganizationsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [orgs, setOrgs] = useState<AdminOrganizationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [idFilter, setIdFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editOrg, setEditOrg] = useState<AdminOrganizationItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editPlan, setEditPlan] = useState("");
  const [editBatchOverride, setEditBatchOverride] = useState("");
  const [editMonthlyOverride, setEditMonthlyOverride] = useState("");
  const [editStripeCustomerId, setEditStripeCustomerId] = useState("");
  const [editStripeSubId, setEditStripeSubId] = useState("");
  const [editSubStatus, setEditSubStatus] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState("");
  const [saving, setSaving] = useState(false);

  const [enterpriseOrg, setEnterpriseOrg] = useState<AdminOrganizationItem | null>(null);
  const [enterpriseLink, setEnterpriseLink] = useState<string | null>(null);
  const [enterpriseLinkAmountCents, setEnterpriseLinkAmountCents] = useState<number | null>(null);
  const [enterpriseLinkPriceId, setEnterpriseLinkPriceId] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [enterpriseAmount, setEnterpriseAmount] = useState("");
  const [enterpriseBatchOverride, setEnterpriseBatchOverride] = useState("");
  const [enterpriseMonthlyOverride, setEnterpriseMonthlyOverride] = useState("");

  const [perPage, setPerPage] = useState(20);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const orgId = Number(idFilter.trim());
      const data = await adminListOrganizations({
        page,
        per_page: perPage,
        q: search || undefined,
        plan: planFilter || undefined,
        org_id: idFilter.trim() && Number.isInteger(orgId) && orgId > 0 ? orgId : undefined,
      });
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
  }, [page, perPage, search, planFilter, idFilter, router]);

  useEffect(() => { load(); }, [load]);

  if (user?.role !== "admin") return null;

  const hasFilters = Boolean(search || planFilter || idFilter.trim());

  const clearFilters = () => {
    setSearch("");
    setPlanFilter("");
    setIdFilter("");
    setPage(1);
  };

  const openEdit = (o: AdminOrganizationItem) => {
    setEditOrg(o);
    setEditName(o.name);
    setEditPlan(o.plan);
    setEditBatchOverride(o.batch_limit_override != null ? String(o.batch_limit_override) : "");
    setEditMonthlyOverride(o.monthly_limit_override != null ? String(o.monthly_limit_override) : "");
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
      const origBatch = editOrg.batch_limit_override != null ? String(editOrg.batch_limit_override) : "";
      if (editBatchOverride !== origBatch)
        payload.batch_limit_override = editBatchOverride === "" ? null : Number(editBatchOverride);
      const origMonthly = editOrg.monthly_limit_override != null ? String(editOrg.monthly_limit_override) : "";
      if (editMonthlyOverride !== origMonthly)
        payload.monthly_limit_override = editMonthlyOverride === "" ? null : Number(editMonthlyOverride);
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

  const enterpriseAmountCents = Math.round(Number(enterpriseAmount.replace(",", ".")) * 100);
  const enterpriseAmountValid = enterpriseAmount.trim() !== "" && Number.isFinite(enterpriseAmountCents) && enterpriseAmountCents > 0;

  const handleProvisionEnterprise = async () => {
    if (!enterpriseOrg || !enterpriseAmountValid) return;
    setProvisioning(true);
    setError(null);
    try {
      const result = await adminProvisionEnterprise(enterpriseOrg.id, {
        amount_cents: enterpriseAmountCents,
        batch_limit_override: enterpriseBatchOverride === "" ? null : Number(enterpriseBatchOverride),
        monthly_limit_override: enterpriseMonthlyOverride === "" ? null : Number(enterpriseMonthlyOverride),
      });
      setEnterpriseLink(result.portal_url);
      setEnterpriseLinkAmountCents(result.amount_cents);
      setEnterpriseLinkPriceId(result.price_id);
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail || err.message);
      else setError("Erro ao gerar o link de upgrade para o Enterprise");
    } finally {
      setProvisioning(false);
    }
  };

  const closeEnterpriseDialog = () => {
    setEnterpriseOrg(null);
    setEnterpriseLink(null);
    setEnterpriseLinkAmountCents(null);
    setEnterpriseLinkPriceId(null);
    setLinkCopied(false);
    setEnterpriseAmount("");
    setEnterpriseBatchOverride("");
    setEnterpriseMonthlyOverride("");
  };

  const handleCopyEnterpriseLink = async () => {
    if (!enterpriseLink) return;
    try {
      await navigator.clipboard.writeText(enterpriseLink);
      setLinkCopied(true);
    } catch {
      // Clipboard indisponível: o link continua visível no campo para copiar manualmente.
    }
  };

  const planColor = (plan: string) => {
    switch (plan) {
      case "basic": return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
      case "starter": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "pro": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "advanced": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "enterprise": return "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300";
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

      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-48 flex-1">
          <label htmlFor="org-search" className="mb-1 block text-xs font-medium text-zinc-500">
            Nome
          </label>
          <Input
            id="org-search"
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-28">
          <label htmlFor="org-id-filter" className="mb-1 block text-xs font-medium text-zinc-500">
            ID
          </label>
          <Input
            id="org-id-filter"
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="Ex.: 42"
            value={idFilter}
            onChange={(e) => {
              setIdFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-44">
          <label htmlFor="org-plan-filter" className="mb-1 block text-xs font-medium text-zinc-500">
            Plano
          </label>
          <select
            id="org-plan-filter"
            className="h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            value={planFilter}
            onChange={(e) => {
              setPlanFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos</option>
            {PLANS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        {hasFilters && (
          <Button type="button" variant="outline" onClick={clearFilters}>
            Limpar
          </Button>
        )}
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="pt-4">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {notice && (
        <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950">
          <CardContent className="pt-4">
            <p className="text-emerald-700 dark:text-emerald-300 text-sm">{notice}</p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-zinc-500">Carregando...</p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Organizações</CardTitle>
            <CardDescription>
              {total === 1 ? "1 resultado" : `${total} resultados`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-zinc-500 dark:text-zinc-400">
                    <th className="pb-2 pr-4">ID</th>
                    <th className="pb-2 pr-4">Nome</th>
                    <th className="pb-2 pr-4">Plano</th>
                    <th className="pb-2 pr-4">Valor Enterprise</th>
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
                      <td className="py-3 pr-4 text-xs">
                        {formatCentsToBrl(o.enterprise_amount_cents)}
                      </td>
                      <td className="py-3 pr-4 text-xs text-zinc-500 font-mono truncate max-w-[120px]">
                        {o.stripe_customer_id ?? "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <SubscriptionStatusBadges
                          status={o.subscription_status}
                          cancelAtPeriodEnd={o.cancel_at_period_end}
                        />
                      </td>
                      <td className="py-3 pr-4 text-zinc-500 text-xs">
                        {new Date(o.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(o)}>
                            Editar
                          </Button>
                          {o.plan !== "enterprise" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={!o.stripe_subscription_id}
                              title={
                                o.stripe_subscription_id
                                  ? "Gerar um link para o cliente confirmar e pagar o upgrade Enterprise"
                                  : "A organização precisa ter uma assinatura ativa no Stripe"
                              }
                              onClick={() => {
                                setNotice(null);
                                setEnterpriseOrg(o);
                                setEnterpriseAmount("");
                                setEnterpriseBatchOverride(o.batch_limit_override != null ? String(o.batch_limit_override) : "");
                                setEnterpriseMonthlyOverride(o.monthly_limit_override != null ? String(o.monthly_limit_override) : "");
                              }}
                            >
                              Gerar link Enterprise
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {orgs.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-zinc-400">
                        Nenhuma organização encontrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <TablePagination
              page={page}
              perPage={perPage}
              total={total}
              onPageChange={setPage}
              onPerPageChange={setPerPage}
              itemLabel={{ singular: "organização", plural: "organizações" }}
            />
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Limite Batch (override)</label>
                <Input
                  type="number"
                  min={0}
                  placeholder="Padrão do plano"
                  value={editBatchOverride}
                  onChange={(e) => setEditBatchOverride(e.target.value)}
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-zinc-400">Vazio = usar padrão do plano</p>
              </div>
              <div>
                <label className="text-sm font-medium">Limite Mensal (override)</label>
                <Input
                  type="number"
                  min={0}
                  placeholder="Padrão do plano"
                  value={editMonthlyOverride}
                  onChange={(e) => setEditMonthlyOverride(e.target.value)}
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-zinc-400">Vazio = usar padrão do plano</p>
              </div>
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

      {/* Enterprise upgrade link dialog */}
      <Dialog open={!!enterpriseOrg} onOpenChange={(open) => !open && closeEnterpriseDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upgrade para Enterprise</DialogTitle>
            <DialogDescription>
              {enterpriseOrg?.name} (ID {enterpriseOrg?.id})
            </DialogDescription>
          </DialogHeader>

          {!enterpriseLink ? (
            <div className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
              <p>
                Será gerado um Price dedicado no Stripe com o valor negociado abaixo e um link do
                Portal de Cobrança, restrito a essa troca, na assinatura{" "}
                <span className="font-mono text-xs">{enterpriseOrg?.stripe_subscription_id}</span>.
              </p>
              <p>
                <strong>Nada é cobrado agora.</strong> Envie o link ao cliente: a troca só é
                efetivada quando ele mesmo abrir o link e confirmar. Nesse momento o Stripe cobra
                imediatamente o ajuste proporcional do período atual, e o plano no seu painel é
                atualizado automaticamente pelo webhook.
              </p>
              <div>
                <label className="text-sm font-medium text-zinc-900 dark:text-white">Valor mensal (R$)</label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Ex.: 1500.00"
                  value={enterpriseAmount}
                  onChange={(e) => setEnterpriseAmount(e.target.value)}
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-zinc-400">Valor negociado com o cliente (obrigatório)</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-900 dark:text-white">Limite Batch (override)</label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Padrão do plano (100)"
                    value={enterpriseBatchOverride}
                    onChange={(e) => setEnterpriseBatchOverride(e.target.value)}
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-zinc-400">Vazio = padrão Enterprise (100)</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-900 dark:text-white">Limite Mensal (override)</label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Padrão do plano (20000)"
                    value={enterpriseMonthlyOverride}
                    onChange={(e) => setEnterpriseMonthlyOverride(e.target.value)}
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-zinc-400">Vazio = padrão Enterprise (20.000)</p>
                </div>
              </div>
              <p>
                Os limites informados acima serão aplicados automaticamente quando o cliente
                confirmar a troca.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={closeEnterpriseDialog} disabled={provisioning}>
                  Cancelar
                </Button>
                <Button onClick={handleProvisionEnterprise} disabled={provisioning || !enterpriseAmountValid}>
                  {provisioning ? "Gerando link..." : "Gerar link"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
              <p>
                Price dedicado criado: <span className="font-mono text-xs">{enterpriseLinkPriceId}</span>{" "}
                no valor de <strong>{formatCentsToBrl(enterpriseLinkAmountCents)}/mês</strong>.
              </p>
              <p>Envie este link ao cliente. Ele é pessoal e válido por tempo limitado:</p>
              <div className="flex gap-2">
                <Input value={enterpriseLink} readOnly className="font-mono text-xs" />
                <Button variant="outline" onClick={handleCopyEnterpriseLink}>
                  {linkCopied ? "Copiado!" : "Copiar"}
                </Button>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={() => { closeEnterpriseDialog(); load(); }}>Concluir</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
