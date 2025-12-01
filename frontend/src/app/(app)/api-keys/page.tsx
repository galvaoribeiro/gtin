"use client";

import { useState } from "react";
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

// Importação dos dados mockados
import {
  initialApiKeys,
  generateMockKey,
  type ApiKey,
} from "@/mocks/apiKeys";

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialApiKeys);
  const [newKeyVisible, setNewKeyVisible] = useState<string | null>(null);

  const handleGenerateKey = () => {
    const newKey = generateMockKey();
    setApiKeys((prev) => [newKey, ...prev]);
    setNewKeyVisible(newKey.key);

    // Esconde a chave completa após 30 segundos
    setTimeout(() => {
      setNewKeyVisible(null);
    }, 30000);
  };

  const handleRevokeKey = (keyId: string) => {
    setApiKeys((prev) =>
      prev.map((key) =>
        key.id === keyId ? { ...key, status: "revoked" as const } : key
      )
    );
  };

  const formatDate = (dateString: string) => {
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
        <Button onClick={handleGenerateKey}>Gerar Nova Chave</Button>
      </div>

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
            <code className="block rounded bg-green-100 p-3 font-mono text-sm text-green-900 dark:bg-green-900 dark:text-green-100">
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
            <CardTitle className="text-2xl">{activeKeys}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Chaves</CardDescription>
            <CardTitle className="text-2xl">{apiKeys.length}</CardTitle>
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
                  <TableCell className="font-medium">{key.name}</TableCell>
                  <TableCell>
                    <code className="rounded bg-zinc-100 px-2 py-1 font-mono text-sm dark:bg-zinc-800">
                      {key.maskedKey}
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
                    {formatDate(key.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-600 dark:text-zinc-400">
                    {key.lastUsed ? formatDate(key.lastUsed) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {key.status === "active" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRevokeKey(key.id)}
                      >
                        Revogar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
