"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  adminListUsers,
  adminUpdateUser,
  adminImpersonateUser,
  type AdminUserItem,
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

export default function AdminUsersPage() {
  const { user, startImpersonation } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editUser, setEditUser] = useState<AdminUserItem | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editPassword, setEditPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const perPage = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminListUsers({ page, per_page: perPage, q: search || undefined });
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
  }, [page, search, router]);

  useEffect(() => { load(); }, [load]);

  if (user?.role !== "admin") {
    return null;
  }

  const totalPages = Math.ceil(total / perPage);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
          Usuários
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Gerenciar todos os usuários da plataforma ({total})
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <Input
          placeholder="Buscar por email..."
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
            <CardTitle>Lista de Usuários</CardTitle>
            <CardDescription>Página {page} de {totalPages || 1}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-zinc-500 dark:text-zinc-400">
                    <th className="pb-2 pr-4">ID</th>
                    <th className="pb-2 pr-4">Email</th>
                    <th className="pb-2 pr-4">Organização</th>
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
                      <td colSpan={7} className="py-8 text-center text-zinc-400">
                        Nenhum usuário encontrado
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
