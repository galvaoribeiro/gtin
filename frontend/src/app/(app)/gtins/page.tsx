"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  fetchGtinDashboard,
  fetchGtinBatchDashboard,
  ApiError,
  type Product,
  type BatchResponse,
} from "@/lib/api";

const BATCH_LIMIT = 50;

function parseGtinList(raw: string): string[] {
  return raw
    .split(/[\n\r\t,;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export default function GtinsPage() {
  const router = useRouter();

  // Individual state
  const [gtin, setGtin] = useState("");
  const [result, setResult] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Batch state
  const [batchInput, setBatchInput] = useState("");
  const [batchResult, setBatchResult] = useState<BatchResponse | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [isBatchLoading, setIsBatchLoading] = useState(false);

  const parsedGtins = parseGtinList(batchInput);
  const parsedCount = parsedGtins.length;

  // Individual search
  const handleSearch = async () => {
    if (!gtin.trim()) return;

    setIsLoading(true);
    setNotFound(false);
    setResult(null);
    setError(null);

    try {
      const product = await fetchGtinDashboard(gtin.trim());
      setResult(product);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          router.push("/login");
        } else if (err.status === 404) {
          setNotFound(true);
        } else {
          setError(err.detail || err.message);
        }
      } else {
        setError("Ocorreu um erro inesperado. Tente novamente.");
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

  // Batch search
  const handleBatchSearch = async () => {
    if (parsedCount === 0 || parsedCount > BATCH_LIMIT) return;

    setIsBatchLoading(true);
    setBatchResult(null);
    setBatchError(null);

    try {
      const response = await fetchGtinBatchDashboard(parsedGtins);
      setBatchResult(response);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          router.push("/login");
        } else {
          setBatchError(err.detail || err.message);
        }
      } else {
        setBatchError("Ocorreu um erro inesperado. Tente novamente.");
      }
    } finally {
      setIsBatchLoading(false);
    }
  };

  // CSV generation helper
  const buildCsv = () => {
    if (!batchResult) return "";
    const header = "GTIN;Status;Produto;Marca;NCM;CEST;País de Origem;Peso;Unidade";
    const rows = batchResult.results.map((item) => {
      const status = item.found ? "Encontrado" : "Não encontrado";
      const p = item.product;
      return [
        item.gtin,
        status,
        p?.product_name || "",
        p?.brand || "",
        p?.ncm_formatted || p?.ncm || "",
        p?.cest?.join(", ") || "",
        p?.origin_country || "",
        p?.gross_weight?.value?.toString() || "",
        p?.gross_weight?.unit || "",
      ].map((v) => `"${v.replace(/"/g, '""')}"`).join(";");
    });
    return [header, ...rows].join("\n");
  };

  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyResults = async () => {
    const csv = buildCsv();
    if (!csv) return;
    await navigator.clipboard.writeText(csv);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const handleDownloadCsv = () => {
    const csv = buildCsv();
    if (!csv) return;
    const bom = "\uFEFF";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "consulta_gtin_lote.csv";
    a.click();
    URL.revokeObjectURL(url);
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

      <Tabs defaultValue="individual">
        <TabsList>
          <TabsTrigger value="individual">Individual</TabsTrigger>
          <TabsTrigger value="batch">Em lote</TabsTrigger>
        </TabsList>

        {/* ===== ABA INDIVIDUAL ===== */}
        <TabsContent value="individual" className="space-y-6">
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
                  <div className="space-y-4">
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
                        <p className="font-mono">{result.ncm_formatted || result.ncm || "\u2014"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-500">CEST</p>
                        <p className="font-mono">
                          {result.cest && result.cest.length > 0
                            ? result.cest.join(", ")
                            : "\u2014"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-500">
                        País de Origem
                      </p>
                      <p>{result.origin_country || "\u2014"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-500">Peso Bruto</p>
                      <p>
                        {result.gross_weight?.value
                          ? `${result.gross_weight.value} ${result.gross_weight.unit}`
                          : "\u2014"}
                      </p>
                    </div>
                  </div>
                </div>

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
        </TabsContent>

        {/* ===== ABA EM LOTE ===== */}
        <TabsContent value="batch" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Consulta em Lote</CardTitle>
              <CardDescription>
                Cole até {BATCH_LIMIT} GTINs, um por linha. Também aceita dados copiados de planilhas (separados por tab, vírgula ou ponto e vírgula).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder={"7898708460003\n7891000100103\n7896036093085\n..."}
                value={batchInput}
                onChange={(e) => setBatchInput(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
              <div className="flex items-center justify-between">
                <p className={`text-sm ${parsedCount > BATCH_LIMIT ? "text-red-600 font-medium" : "text-zinc-500"}`}>
                  {parsedCount} / {BATCH_LIMIT} GTINs
                </p>
                <Button
                  onClick={handleBatchSearch}
                  disabled={isBatchLoading || parsedCount === 0 || parsedCount > BATCH_LIMIT}
                >
                  {isBatchLoading ? (
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
                    "Consultar lote"
                  )}
                </Button>
              </div>
              {parsedCount > BATCH_LIMIT && (
                <p className="text-sm text-red-600">
                  Limite excedido. Reduza para no máximo {BATCH_LIMIT} GTINs.
                </p>
              )}
            </CardContent>
          </Card>

          {batchError && (
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
                      Erro ao consultar lote
                    </p>
                    <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                      {batchError}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {batchResult && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>Resultados</CardTitle>
                    <CardDescription className="mt-1">
                      {batchResult.total_requested} consultados {"\u00b7"}{" "}
                      <span className="text-green-700 dark:text-green-400">{batchResult.total_found} encontrados</span> {"\u00b7"}{" "}
                      <span className="text-amber-700 dark:text-amber-400">{batchResult.total_requested - batchResult.total_found} não encontrados</span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={handleCopyResults}>
                      {copySuccess ? "Copiado!" : "Copiar"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadCsv}>
                      Baixar CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>GTIN</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>NCM</TableHead>
                      <TableHead>CEST</TableHead>
                      <TableHead>País de Origem</TableHead>
                      <TableHead>Peso</TableHead>
                      <TableHead>Unidade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batchResult.results.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-xs">
                          {item.gtin}
                        </TableCell>
                        <TableCell>
                          {item.found ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Encontrado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-700">
                              Não encontrado
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {item.product?.product_name || "\u2014"}
                        </TableCell>
                        <TableCell>
                          {item.product?.brand || "\u2014"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {item.product?.ncm_formatted || item.product?.ncm || "\u2014"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {item.product?.cest && item.product.cest.length > 0
                            ? item.product.cest.join(", ")
                            : "\u2014"}
                        </TableCell>
                        <TableCell>
                          {item.product?.origin_country || "\u2014"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {item.product?.gross_weight?.value || "\u2014"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {item.product?.gross_weight?.unit || "\u2014"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
