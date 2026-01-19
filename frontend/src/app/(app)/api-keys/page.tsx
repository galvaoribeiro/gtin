"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/landing-page/components/ui/dialog";

// Importação das funções de API
import {
  getDashboardApiKeys,
  createDashboardApiKey,
  revokeDashboardApiKey,
  type DashboardApiKey,
  ApiError,
} from "@/lib/api";

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<DashboardApiKey[]>([]);
  const [newKeyVisible, setNewKeyVisible] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [activeLimit, setActiveLimit] = useState(0);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [keyToRevoke, setKeyToRevoke] = useState<DashboardApiKey | null>(null);
  const PER_PAGE = 10;
  const router = useRouter();

  // Carregar API keys ao montar o componente
  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async (pageToLoad = page) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDashboardApiKeys({
        page: pageToLoad,
        per_page: PER_PAGE,
      });
      setApiKeys(response.items);
      setPage(response.page);
      setTotal(response.total);
      setActiveCount(response.active_count);
      setActiveLimit(response.active_limit);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          // Sessão expirada - redireciona para login
          router.push("/login");
          return;
        }
        setError(err.detail || err.message);
      } else {
        setError("Erro ao carregar API keys");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async (name?: string) => {
    try {
      setActionLoading(true);
      setError(null);
      
      const newKey = await createDashboardApiKey(name || undefined);
      
      // Mostra a key completa
      setNewKeyVisible(newKey.key);

      // Fecha o dialog e limpa o campo
      setDialogOpen(false);
      setKeyName("");

      // Recarrega primeira página para exibir a nova chave e atualizar contadores
      await loadApiKeys(1);

      // Esconde a chave completa após 60 segundos
      setTimeout(() => {
        setNewKeyVisible(null);
      }, 60000);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          router.push("/login");
          return;
        }
        setError(err.detail || err.message);
      } else {
        setError("Erro ao gerar nova chave");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeKey = async (keyId: number) => {
    try {
      setActionLoading(true);
      setError(null);
      
      await revokeDashboardApiKey(keyId);
      
      // Recarrega a página atual para refletir mudanças
      await loadApiKeys(page);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          router.push("/login");
          return;
        }
        setError(err.detail || err.message);
      } else {
        setError("Erro ao revogar chave");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const openRevokeDialog = (key: DashboardApiKey) => {
    setKeyToRevoke(key);
    setRevokeDialogOpen(true);
  };

  const confirmRevoke = async () => {
    if (!keyToRevoke) return;
    await handleRevokeKey(keyToRevoke.id);
    setRevokeDialogOpen(false);
    setKeyToRevoke(null);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const disableCreate = activeLimit > 0 && activeCount >= activeLimit;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            API Keys
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Gerencie suas chaves de acesso à API
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button onClick={() => setDialogOpen(true)} disabled={actionLoading || disableCreate}>
          Gerar Nova Chave
          </Button>
          {disableCreate && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Limite de chaves ativas atingido ({activeCount}/{activeLimit}).
            </p>
          )}
        </div>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-800 dark:text-red-200">
              Erro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Dialog para criar nova chave */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar Nova API Key</DialogTitle>
            <DialogDescription>
              Dê um nome descritivo para sua nova chave de API. Isso ajudará você a identificá-la no futuro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="key-name" className="text-sm font-medium">
                Nome da chave
              </label>
              <Input
                id="key-name"
                placeholder="Ex: Chave de produção, Chave de desenvolvimento..."
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !actionLoading) {
                    handleGenerateKey(keyName.trim() || undefined);
                  }
                }}
                maxLength={100}
                autoFocus
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Deixe em branco para usar o nome padrão &quot;Nova chave&quot;
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setKeyName("");
              }}
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => handleGenerateKey(keyName.trim() || undefined)}
              disabled={actionLoading}
            >
              {actionLoading ? "Gerando..." : "Gerar Chave"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alerta de nova chave */}
      {newKeyVisible && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-800 dark:text-green-200">
              Nova chave gerada!
            </CardTitle>
            <CardDescription className="text-green-700 dark:text-green-300">
              Copie sua chave agora. Por segurança, ela não será exibida
              novamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <code className="block rounded bg-green-100 p-3 font-mono text-sm text-green-900 dark:bg-green-900 dark:text-green-100 break-all">
              {newKeyVisible}
            </code>
          </CardContent>
        </Card>
      )}

      {/* Resumo */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Chaves Ativas</CardDescription>
            <CardTitle className="text-2xl">{loading ? "—" : activeCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Chaves</CardDescription>
            <CardTitle className="text-2xl">{loading ? "—" : total}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabela de Keys */}
      <Card>
        <CardHeader>
          <CardTitle>Suas Chaves</CardTitle>
          <CardDescription>
            Lista de todas as API keys da sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-zinc-500">Carregando...</p>
            </div>
          ) : total === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-zinc-500">Nenhuma API key encontrada. Clique em &quot;Gerar Nova Chave&quot; para criar uma.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Chave</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criada em</TableHead>
                    <TableHead>Último uso</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.name || "Sem nome"}</TableCell>
                      <TableCell>
                        <code className="rounded bg-zinc-100 px-2 py-1 font-mono text-sm dark:bg-zinc-800">
                          {key.masked_key}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            key.status === "active" ? "default" : "destructive"
                          }
                        >
                          {key.status === "active" ? "Ativa" : "Revogada"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-zinc-600 dark:text-zinc-400">
                        {formatDate(key.created_at)}
                      </TableCell>
                      <TableCell className="text-sm text-zinc-600 dark:text-zinc-400">
                        {formatDate(key.last_used_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        {key.status === "active" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openRevokeDialog(key)}
                            disabled={actionLoading}
                          >
                            Revogar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-300">
                <span>
                  Página {page} de {totalPages} — {total} chaves no total
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadApiKeys(page - 1)}
                    disabled={page <= 1 || loading}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadApiKeys(page + 1)}
                    disabled={page >= totalPages || loading}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmação de revogação */}
      <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revogar API Key</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja revogar esta API key? Essa ação não poderá ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Chave: <code className="rounded bg-zinc-100 px-2 py-1 font-mono text-xs dark:bg-zinc-800">{keyToRevoke?.masked_key}</code>
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">
              Nome: {keyToRevoke?.name || "Sem nome"}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRevokeDialogOpen(false);
                setKeyToRevoke(null);
              }}
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRevoke}
              disabled={actionLoading}
            >
              {actionLoading ? "Revogando..." : "Revogar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
