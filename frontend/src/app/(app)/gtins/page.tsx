"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// API helper para chamadas reais
import { fetchGtin, ApiError, type Product } from "@/lib/api";

// Fallback para mocks (opcional, apenas em desenvolvimento)
import { findProduct as findMockProduct } from "@/mocks/product";

// Flag para usar mocks como fallback em desenvolvimento
const USE_MOCK_FALLBACK = process.env.NODE_ENV === "development";

export default function GtinsPage() {
  const [gtin, setGtin] = useState("");
  const [result, setResult] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [usingMock, setUsingMock] = useState(false);

  const handleSearch = async () => {
    if (!gtin.trim()) return;

    setIsLoading(true);
    setNotFound(false);
    setResult(null);
    setError(null);
    setUsingMock(false);

    try {
      // Tenta buscar na API real
      const product = await fetchGtin(gtin.trim());
      setResult(product);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          // GTIN não encontrado na API
          setNotFound(true);
        } else if (err.status === 0 && USE_MOCK_FALLBACK) {
          // Erro de conexão - usar mock como fallback em dev
          console.warn("API offline, usando mock como fallback");
          const mockProduct = findMockProduct(gtin.trim());
          if (mockProduct) {
            setResult(mockProduct as Product);
            setUsingMock(true);
          } else {
            setNotFound(true);
          }
        } else {
          // Outro erro da API
          setError(err.detail || err.message);
        }
      } else {
        // Erro inesperado
        setError("Ocorreu um erro inesperado. Tente novamente.");
        console.error("Erro inesperado:", err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
          Consulta de GTINs
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Busque informações de produtos pelo código GTIN/EAN
        </p>
      </div>

      {/* Formulário de Busca */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Produto</CardTitle>
          <CardDescription>
            Digite o código GTIN (EAN-13) do produto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              type="text"
              placeholder="Ex: 7898708460003"
              value={gtin}
              onChange={(e) => setGtin(e.target.value)}
              onKeyDown={handleKeyDown}
              className="max-w-xs"
            />
            <Button onClick={handleSearch} disabled={isLoading || !gtin.trim()}>
              {isLoading ? (
                <>
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Consultando...
                </>
              ) : (
                "Consultar"
              )}
            </Button>
          </div>
          <p className="mt-3 text-sm text-zinc-500">
            Consulte qualquer GTIN cadastrado no banco de dados
          </p>
        </CardContent>
      </Card>

      {/* Erro de conexão/servidor */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 text-red-600 dark:text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
              <div>
                <p className="font-medium text-red-800 dark:text-red-200">
                  Erro ao consultar
                </p>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  {error}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultado Not Found */}
      {notFound && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 text-amber-600 dark:text-amber-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
              <p className="text-amber-800 dark:text-amber-200">
                GTIN <strong className="font-mono">{gtin}</strong> não encontrado
                na base de dados.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aviso de uso de mock */}
      {usingMock && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                />
              </svg>
              <span>
                API offline — exibindo dados de demonstração (mock)
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultado da Busca */}
      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="break-words">{result.product_name}</CardTitle>
                <CardDescription className="mt-1">
                  {result.brand}
                </CardDescription>
              </div>
              <Badge variant="outline" className="shrink-0 font-mono">
                {result.gtin}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Coluna esquerda - Imagem (se existir) e dados */}
              <div className="space-y-4">
                {result.image_url && (
                  <div className="flex justify-center rounded-lg border bg-white p-4 dark:bg-zinc-900">
                    <img
                      src={result.image_url}
                      alt={result.product_name}
                      className="max-h-48 object-contain"
                      onError={(e) => {
                        // Esconde a imagem se falhar ao carregar
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-500">GTIN</p>
                    <p className="font-mono">{result.gtin}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-500">Tipo GTIN</p>
                    <p>EAN-{result.gtin_type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-500">NCM</p>
                    <p className="font-mono">{result.ncm_formatted || result.ncm || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-500">CEST</p>
                    <p className="font-mono">
                      {result.cest && result.cest.length > 0
                        ? result.cest.join(", ")
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Coluna direita - Mais dados */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-zinc-500">
                    CNPJ Detentor
                  </p>
                  <p className="font-mono">{result.owner_tax_id || "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-500">
                    País de Origem
                  </p>
                  <p>{result.origin_country || "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-500">Peso Bruto</p>
                  <p>
                    {result.gross_weight?.value
                      ? `${result.gross_weight.value} ${result.gross_weight.unit}`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-500">
                    Atualizado em
                  </p>
                  <p>
                    {result.updated_at
                      ? new Date(result.updated_at).toLocaleDateString("pt-BR")
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* JSON Raw */}
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium text-zinc-500">
                Resposta JSON
              </p>
              <pre className="overflow-auto rounded-lg bg-zinc-100 p-4 text-xs dark:bg-zinc-800">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
