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
  const router = useRouter();

  // Carregar API keys ao montar o componente
  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      const keys = await getDashboardApiKeys();
      setApiKeys(keys);
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

  const handleGenerateKey = async () => {
    try {
      setActionLoading(true);
      setError(null);
      
      const newKey = await createDashboardApiKey();
      
      // Adiciona a nova chave no início da lista
      setApiKeys((prev) => [{
        id: newKey.id,
        name: newKey.name,
        masked_key: newKey.masked_key,
        status: newKey.status,
        created_at: newKey.created_at,
        last_used_at: newKey.last_used_at,
      }, ...prev]);
      
      // Mostra a key completa
      setNewKeyVisible(newKey.key);

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
      
      const updatedKey = await revokeDashboardApiKey(keyId);
      
      // Atualiza a chave na lista
      setApiKeys((prev) =>
        prev.map((key) =>
          key.id === keyId ? { ...key, status: updatedKey.status, last_used_at: updatedKey.last_used_at } : key
        )
      );
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

  const activeKeys = apiKeys.filter((k) => k.status === "active").length;

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
        <Button onClick={handleGenerateKey} disabled={actionLoading}>
          {actionLoading ? "Gerando..." : "Gerar Nova Chave"}
        </Button>
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
            <CardTitle className="text-2xl">{loading ? "—" : activeKeys}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Chaves</CardDescription>
            <CardTitle className="text-2xl">{loading ? "—" : apiKeys.length}</CardTitle>
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
          ) : apiKeys.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-zinc-500">Nenhuma API key encontrada. Clique em &quot;Gerar Nova Chave&quot; para criar uma.</p>
            </div>
          ) : (
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
                          onClick={() => handleRevokeKey(key.id)}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
