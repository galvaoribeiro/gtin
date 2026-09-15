"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  adminListUsers,
  adminExportUsers,
  adminUpdateUser,
  adminImpersonateUser,
  type AdminUserItem,
  ApiError,
} from "@/lib/api";
import { Download } from "lucide-react";
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

const filterSelectClass =
  "h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white";

function parsePositiveInt(value: string): number | undefined {
  const n = Number(value.trim());
  return value.trim() && Number.isInteger(n) && n > 0 ? n : undefined;
}

export default function AdminUsersPage() {
  const { user, startImpersonation } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [idFilter, setIdFilter] = useState("");
  const [orgIdFilter, setOrgIdFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [subscriptionFilter, setSubscriptionFilter] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editUser, setEditUser] = useState<AdminUserItem | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editPassword, setEditPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const [perPage, setPerPage] = useState(20);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminListUsers({
        page,
        per_page: perPage,
        q: search.trim() || undefined,
        user_id: parsePositiveInt(idFilter),
        organization_id: parsePositiveInt(orgIdFilter),
        role: roleFilter || undefined,
        is_active: statusFilter === "" ? undefined : statusFilter === "true",
        plan: planFilter || undefined,
        subscription_status: subscriptionFilter || undefined,
        created_from: createdFrom || undefined,
        created_to: createdTo || undefined,
      });
      setUsers(data.items);
      setTotal(data.total);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail || err.message);
        if (err.status === 403) router.push("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, idFilter, orgIdFilter, roleFilter, statusFilter, planFilter, subscriptionFilter, createdFrom, createdTo, router]);

  useEffect(() => { load(); }, [load]);

  if (user?.role !== "admin") {
    return null;
  }

  const hasFilters = Boolean(
    search.trim() ||
    idFilter.trim() ||
    orgIdFilter.trim() ||
    roleFilter ||
    statusFilter ||
    planFilter ||
    subscriptionFilter ||
    createdFrom ||
    createdTo
  );

  const resetPage = () => setPage(1);

  const clearFilters = () => {
    setSearch("");
    setIdFilter("");
    setOrgIdFilter("");
    setRoleFilter("");
    setStatusFilter("");
    setPlanFilter("");
    setSubscriptionFilter("");
    setCreatedFrom("");
    setCreatedTo("");
    setPage(1);
  };

  const openEdit = (u: AdminUserItem) => {
    setEditUser(u);
    setEditRole(u.role);
    setEditActive(u.is_active);
    setEditPassword("");
  };

  const handleSave = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      if (editRole !== editUser.role) payload.role = editRole;
      if (editActive !== editUser.is_active) payload.is_active = editActive;
      if (editPassword) payload.new_password = editPassword;
      if (Object.keys(payload).length === 0) { setEditUser(null); return; }
      await adminUpdateUser(editUser.id, payload as { is_active?: boolean; role?: string; new_password?: string });
      setEditUser(null);
      load();
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleImpersonate = async (userId: number) => {
    try {
      const res = await adminImpersonateUser(userId);
      await startImpersonation(res.access_token);
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail || err.message);
    }
  };

  const currentFilters = () => ({
    q: search.trim() || undefined,
    user_id: parsePositiveInt(idFilter),
    organization_id: parsePositiveInt(orgIdFilter),
    role: roleFilter || undefined,
    is_active: statusFilter === "" ? undefined : statusFilter === "true",
    plan: planFilter || undefined,
    subscription_status: subscriptionFilter || undefined,
    created_from: createdFrom || undefined,
    created_to: createdTo || undefined,
  });

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      await adminExportUsers(currentFilters());
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail || err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            Usuários
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Gerenciar todos os usuários da plataforma ({total})
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="self-start shrink-0"
          onClick={handleExport}
          disabled={exporting || (!loading && total === 0)}
        >
          <Download />
          {exporting ? "Exportando..." : "Exportar CSV"}
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-52 flex-1">
          <label htmlFor="user-search" className="mb-1 block text-xs font-medium text-zinc-500">
            Email ou organização
          </label>
          <Input
            id="user-search"
            placeholder="Buscar por email ou nome da org..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
          />
        </div>
        <div className="w-24">
          <label htmlFor="user-id-filter" className="mb-1 block text-xs font-medium text-zinc-500">
            ID
          </label>
          <Input
            id="user-id-filter"
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="Ex.: 12"
            value={idFilter}
            onChange={(e) => {
              setIdFilter(e.target.value);
              resetPage();
            }}
          />
        </div>
        <div className="w-28">
          <label htmlFor="user-org-id-filter" className="mb-1 block text-xs font-medium text-zinc-500">
            Org. ID
          </label>
          <Input
            id="user-org-id-filter"
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="Ex.: 42"
            value={orgIdFilter}
            onChange={(e) => {
              setOrgIdFilter(e.target.value);
              resetPage();
            }}
          />
        </div>
        <div className="w-32">
          <label htmlFor="user-role-filter" className="mb-1 block text-xs font-medium text-zinc-500">
            Papel
          </label>
          <select
            id="user-role-filter"
            className={filterSelectClass}
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              resetPage();
            }}
          >
            <option value="">Todos</option>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </div>
        <div className="w-32">
          <label htmlFor="user-status-filter" className="mb-1 block text-xs font-medium text-zinc-500">
            Status
          </label>
          <select
            id="user-status-filter"
            className={filterSelectClass}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              resetPage();
            }}
          >
            <option value="">Todos</option>
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </select>
        </div>
        <div className="w-40">
          <label htmlFor="user-plan-filter" className="mb-1 block text-xs font-medium text-zinc-500">
            Plano da org
          </label>
          <select
            id="user-plan-filter"
            className={filterSelectClass}
            value={planFilter}
            onChange={(e) => {
              setPlanFilter(e.target.value);
              resetPage();
            }}
          >
            <option value="">Todos</option>
            {PLANS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="w-44">
          <label htmlFor="user-subscription-filter" className="mb-1 block text-xs font-medium text-zinc-500">
            Assinatura
          </label>
          <select
            id="user-subscription-filter"
            className={filterSelectClass}
            value={subscriptionFilter}
            onChange={(e) => {
              setSubscriptionFilter(e.target.value);
              resetPage();
            }}
          >
            <option value="">Todas</option>
            <option value="active">Ativa</option>
            <option value="cancel_at_period_end">Cancelamento agendado</option>
            <option value="canceled">Cancelada</option>
            <option value="past_due">Vencida</option>
            <option value="trialing">Trial</option>
            <option value="none">Sem assinatura</option>
          </select>
        </div>
        <div className="w-40">
          <label htmlFor="user-created-from" className="mb-1 block text-xs font-medium text-zinc-500">
            Criado de
          </label>
          <Input
            id="user-created-from"
            type="date"
            value={createdFrom}
            onChange={(e) => {
              setCreatedFrom(e.target.value);
              resetPage();
            }}
          />
        </div>
        <div className="w-40">
          <label htmlFor="user-created-to" className="mb-1 block text-xs font-medium text-zinc-500">
            Criado até
          </label>
          <Input
            id="user-created-to"
            type="date"
            value={createdTo}
            onChange={(e) => {
              setCreatedTo(e.target.value);
              resetPage();
            }}
          />
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

      {loading ? (
        <p className="text-zinc-500">Carregando...</p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuários</CardTitle>
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
                    <th className="pb-2 pr-4">Email</th>
                    <th className="pb-2 pr-4">Organização</th>
                    <th className="pb-2 pr-4">Plano</th>
                    <th className="pb-2 pr-4">Assinatura</th>
                    <th className="pb-2 pr-4">Role</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Criado em</th>
                    <th className="pb-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b last:border-0 dark:border-zinc-800">
                      <td className="py-3 pr-4 font-mono text-xs">{u.id}</td>
                      <td className="py-3 pr-4">{u.email}</td>
                      <td className="py-3 pr-4 text-zinc-500">{u.organization_name ?? `#${u.organization_id}`}</td>
                      <td className="py-3 pr-4">
                        {u.plan ? (
                          <Badge variant="secondary">{u.plan}</Badge>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <SubscriptionStatusBadges
                          status={u.subscription_status}
                          cancelAtPeriodEnd={u.cancel_at_period_end}
                        />
                      </td>
                      <td className="py-3 pr-4">
                        {u.role === "admin" ? (
                          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">admin</Badge>
                        ) : (
                          <Badge variant="secondary">user</Badge>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {u.is_active ? (
                          <Badge variant="default">Ativo</Badge>
                        ) : (
                          <Badge variant="destructive">Inativo</Badge>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-zinc-500 text-xs">
                        {new Date(u.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-3 flex gap-1 flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => openEdit(u)}>
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleImpersonate(u.id)}
                          disabled={u.id === user?.id || !u.is_active}
                        >
                          Logar como
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-zinc-400">
                        Nenhum usuário encontrado
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
              itemLabel={{ singular: "usuário", plural: "usuários" }}
            />
          </CardContent>
        </Card>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>{editUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Role</label>
              <select
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <select
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                value={editActive ? "true" : "false"}
                onChange={(e) => setEditActive(e.target.value === "true")}
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Nova senha (opcional)</label>
              <Input
                type="password"
                placeholder="Deixe vazio para manter"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditUser(null)} disabled={saving}>
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
