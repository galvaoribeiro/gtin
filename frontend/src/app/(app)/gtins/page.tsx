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

// Importação dos dados mockados
import { findProduct, type Product } from "@/mocks/product";

export default function GtinsPage() {
  const [gtin, setGtin] = useState("");
  const [result, setResult] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!gtin.trim()) return;

    setIsLoading(true);
    setNotFound(false);
    setResult(null);

    // Simula delay de requisição
    await new Promise((resolve) => setTimeout(resolve, 500));

    const product = findProduct(gtin.trim());

    if (product) {
      setResult(product);
    } else {
      setNotFound(true);
    }

    setIsLoading(false);
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
              {isLoading ? "Consultando..." : "Consultar"}
            </Button>
          </div>
          <p className="mt-3 text-sm text-zinc-500">
            GTINs de exemplo: 7898708460003, 7891000100103, 7891910000197
          </p>
        </CardContent>
      </Card>

      {/* Resultado Not Found */}
      {notFound && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CardContent className="pt-6">
            <p className="text-amber-800 dark:text-amber-200">
              GTIN <strong>{gtin}</strong> não encontrado na base de dados.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Resultado da Busca */}
      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{result.product_name}</CardTitle>
                <CardDescription className="mt-1">
                  {result.brand}
                </CardDescription>
              </div>
              <Badge variant="outline">{result.gtin}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
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
                  <p className="font-mono">{result.ncm_formatted}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-500">CEST</p>
                  <p className="font-mono">
                    {result.cest.length > 0 ? result.cest.join(", ") : "—"}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-zinc-500">
                    CNPJ Detentor
                  </p>
                  <p className="font-mono">{result.owner_tax_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-500">
                    País de Origem
                  </p>
                  <p>{result.origin_country}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-500">Peso Bruto</p>
                  <p>
                    {result.gross_weight.value} {result.gross_weight.unit}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-500">
                    Atualizado em
                  </p>
                  <p>
                    {new Date(result.updated_at).toLocaleDateString("pt-BR")}
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
