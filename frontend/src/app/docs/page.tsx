"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { CodeBlock } from "@/app/docs/_components/CodeBlock"
import { EndpointCard } from "@/app/docs/_components/EndpointCard"
import { Toc, type TocItem } from "@/app/docs/_components/Toc"

export default function DocsPage() {
  const tocItems: TocItem[] = [
    { id: "introducao", label: "Introdução" },
    { id: "autenticacao", label: "Autenticação" },
    { id: "quickstart", label: "Quickstart" },
    { id: "endpoints", label: "Endpoints" },
    { id: "rate-limits", label: "Rate limits e quotas" },
    { id: "erros", label: "Erros" },
    { id: "exemplos", label: "Exemplos" },
  ]

  const baseUrl = "https://api.example.com"
  const [tocOpen, setTocOpen] = React.useState(false) 

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-gradient-to-b from-muted/40 to-background">
        <div className="container mx-auto px-4 py-10 max-w-6xl">
          <div className="flex flex-col gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">API Key</Badge>
                <Badge variant="outline">JSON</Badge>
                <Badge variant="outline">Rate limited</Badge>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">GTIN API</h1>
              <p className="text-muted-foreground max-w-3xl">
                Consulte dados de produtos por GTIN (EAN/UPC/ISBN). Inclui lookup unitário, consultas em batch e busca
                por filtros.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <a href="#endpoints">Ver endpoints</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="#quickstart">Quickstart</a>
              </Button>
              <Button variant="ghost" asChild>
                <a href="#rate-limits">Rate limits</a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-6xl">
        <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-10">
          <div className="min-w-0 space-y-12">
            <div className="flex items-center justify-between gap-3 lg:hidden">
              <div className="text-sm text-muted-foreground">Índice</div>
              <Sheet open={tocOpen} onOpenChange={setTocOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    Abrir
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[320px]">
                  <SheetHeader>
                    <SheetTitle>Nesta página</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <Toc items={tocItems} onNavigate={() => setTocOpen(false)} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <section id="introducao" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground">Introdução</h2>
              <p className="text-foreground leading-relaxed mt-4">
                A GTIN API permite consultar informações de produtos por GTIN. O servidor normaliza o GTIN removendo
                caracteres não numéricos (por exemplo, espaços e traços).
              </p>
              <div className="mt-6">
                <Card className="p-6">
                  <div className="text-sm font-semibold text-foreground">Formatos suportados</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    GTIN-8, GTIN-12, GTIN-13 e GTIN-14 (inclui EAN/UPC/ISBN quando aplicável).
                  </p>
                </Card>
              </div>
          </section>

            <Separator />

            <section id="autenticacao" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground">Autenticação</h2>
              <p className="text-foreground leading-relaxed mt-4">
                Todos os endpoints desta página exigem uma API key válida. Você pode enviar a chave em um destes
                cabeçalhos:
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Card className="p-6">
                  <div className="text-sm font-semibold text-foreground">Authorization</div>
                  <p className="text-sm text-muted-foreground mt-1">Formato Bearer</p>
                  <CodeBlock
                    className="mt-4"
                    code={`Authorization: Bearer SUA_CHAVE_API`}
                  />
                </Card>
                <Card className="p-6">
                  <div className="text-sm font-semibold text-foreground">X-API-Key</div>
                  <p className="text-sm text-muted-foreground mt-1">Cabeçalho direto</p>
                  <CodeBlock className="mt-4" code={`X-API-Key: SUA_CHAVE_API`} />
            </Card>
              </div>

              <div className="mt-6 rounded-lg border border-border bg-muted/40 p-4">
                <p className="text-sm text-foreground">
                  <span className="font-semibold">Dica:</span> para aplicações servidor-servidor, prefira{" "}
                  <code className="bg-muted px-2 py-1 rounded text-xs">X-API-Key</code>. Para ferramentas e proxies que
                  já usam <code className="bg-muted px-2 py-1 rounded text-xs">Authorization</code>, use Bearer.
              </p>
            </div>
          </section>

            <Separator />

            <section id="quickstart" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground">Quickstart</h2>
              <p className="text-foreground leading-relaxed mt-4">
                Use o exemplo abaixo para fazer a primeira consulta.
              </p>

              <Card className="p-6 mt-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">Base URL</Badge>
                    <code className="text-sm font-mono text-foreground">{baseUrl}</code>
                  </div>
                  <CodeBlock
                    title="cURL (lookup unitário)"
                    code={`curl -X GET "${baseUrl}/v1/gtins/7891234567890" \\\n  -H "X-API-Key: SUA_CHAVE_API"`}
                  />
                </div>
              </Card>
            </section>

            <Separator />

            <section id="endpoints" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground">Endpoints</h2>
              <p className="text-foreground leading-relaxed mt-4">
                A seguir estão os endpoints suportados nesta API.
              </p>

              <div className="mt-6 space-y-6">
                <EndpointCard
                  method="GET"
                  path="/v1/gtins/{gtin}"
                  title="Consultar produto por GTIN"
                  badgeNote="Lookup (req/min)"
                  description="Retorna os dados de um produto a partir do seu GTIN. Caracteres não numéricos no parâmetro são ignorados."
                  params={[
                    {
                      name: "gtin",
                      description: "GTIN do produto (8, 12, 13 ou 14 dígitos).",
                    },
                  ]}
                  requestExample={`curl -X GET "${baseUrl}/v1/gtins/7891234567890" \\\n  -H "Authorization: Bearer SUA_CHAVE_API"`}
                  responseExample={`{\n  "gtin": "7891234567890",\n  "gtin_type": "GTIN-13",\n  "brand": "Marca Exemplo",\n  "product_name": "Produto Exemplo 500ml",\n  "owner_tax_id": "00000000000000",\n  "origin_country": "BR",\n  "ncm": "00000000",\n  "cest": "0000000",\n  "gross_weight_value": 0.5,\n  "gross_weight_unit": "kg",\n  "dsit_date": "2025-01-15",\n  "updated_at": "2026-01-16T10:30:00Z",\n  "image_url": "https://example.com/image.jpg"\n}`}
                  statusCodes={[
                    { code: 200, description: "Produto encontrado" },
                    { code: 400, description: "GTIN inválido ou parâmetros inválidos" },
                    { code: 401, description: "API key ausente ou inválida" },
                    { code: 403, description: "Plano sem acesso à API" },
                    { code: 404, description: "Produto não encontrado" },
                    { code: 429, description: "Rate limit ou quota mensal excedida" },
                  ]}
                />

                <EndpointCard
                  method="POST"
                  path="/v1/gtins/batch"
                  title="Consultar produtos em lote (POST)"
                  badgeNote="Lookup (req/min)"
                  description="Consulta múltiplos GTINs em uma única requisição. O limite de itens por batch depende do seu plano, com hard limit de 100 GTINs por requisição."
                  requestExample={`curl -X POST "${baseUrl}/v1/gtins/batch" \\\n  -H "X-API-Key: SUA_CHAVE_API" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "gtins": ["7891234567890", "0012345678905"]\n  }'`}
                  responseExample={`{\n  "total_requested": 2,\n  "total_found": 1,\n  "results": [\n    {\n      "gtin": "7891234567890",\n      "found": true,\n      "product": {\n        "gtin": "7891234567890",\n        "gtin_type": "GTIN-13",\n        "brand": "Marca Exemplo",\n        "product_name": "Produto Exemplo 500ml",\n        "owner_tax_id": "00000000000000",\n        "origin_country": "BR",\n        "ncm": "00000000",\n        "cest": "0000000",\n        "gross_weight_value": 0.5,\n        "gross_weight_unit": "kg",\n        "dsit_date": "2025-01-15",\n        "updated_at": "2026-01-16T10:30:00Z",\n        "image_url": "https://example.com/image.jpg"\n      }\n    },\n    {\n      "gtin": "0012345678905",\n      "found": false,\n      "product": null\n    }\n  ]\n}`}
                  statusCodes={[
                    { code: 200, description: "Consulta em lote concluída" },
                    { code: 400, description: "Requisição inválida (ex.: acima do limite do plano)" },
                    { code: 401, description: "API key ausente ou inválida" },
                    { code: 403, description: "Plano sem acesso a batch" },
                    { code: 429, description: "Rate limit ou quota mensal excedida" },
                  ]}
                />

                <EndpointCard
                  method="GET"
                  path="/v1/gtins/batch?gtin=..."
                  title="Consultar produtos em lote (GET)"
                  badgeNote="Lookup (req/min)"
                  description="Versão cacheável do batch via query string. Use o parâmetro repetido `gtin` (ex.: `?gtin=...&gtin=...`). Esta rota limita o batch em 10 GTINs por requisição e responde com headers de cache (`Cache-Control: private, max-age=3600` e `Vary: X-API-Key`)."
                  requestExample={`curl -X GET "${baseUrl}/v1/gtins/batch?gtin=7891234567890&gtin=0012345678905" \\\n  -H "X-API-Key: SUA_CHAVE_API"`}
                  responseExample={`{\n  "total_requested": 2,\n  "total_found": 1,\n  "results": [\n    {\n      "gtin": "7891234567890",\n      "found": true,\n      "product": {\n        "gtin": "7891234567890",\n        "gtin_type": "GTIN-13",\n        "brand": "Marca Exemplo",\n        "product_name": "Produto Exemplo 500ml",\n        "ncm": "00000000",\n        "updated_at": "2026-01-16T10:30:00Z",\n        "image_url": "https://example.com/image.jpg"\n      }\n    },\n    {\n      "gtin": "0012345678905",\n      "found": false,\n      "product": null\n    }\n  ]\n}`}
                  statusCodes={[
                    { code: 200, description: "Consulta em lote concluída" },
                    { code: 400, description: "Máximo de 10 GTINs no GET /batch" },
                    { code: 401, description: "API key ausente ou inválida" },
                    { code: 403, description: "Plano sem acesso a batch" },
                    { code: 429, description: "Rate limit ou quota mensal excedida" },
                  ]}
                />

                <EndpointCard
                  method="GET"
                  path="/v1/gtins/search"
                  title="Buscar produtos por filtros"
                  badgeNote="Search (cooldown)"
                  description="Busca produtos por brand, product_name e/ou ncm. Exige pelo menos um filtro. Paginação via offset com limite fixo de 10 itens."
                  params={[
                    { name: "brand", description: "Marca (contém, case-insensitive)." },
                    { name: "product_name", description: "Nome do produto (contém, case-insensitive)." },
                    { name: "ncm", description: "Código NCM (match exato)." },
                    { name: "offset", description: "Offset para paginação (recomendado múltiplos de 10)." },
                  ]}
                  requestExample={`curl -X GET "${baseUrl}/v1/gtins/search?brand=acme&offset=0" \\\n  -H "X-API-Key: SUA_CHAVE_API"`}
                  responseExample={`{\n  "total": 42,\n  "offset": 0,\n  "limit": 10,\n  "returned": 2,\n  "items": [\n    {\n      "gtin": "7891234567890",\n      "gtin_type": "GTIN-13",\n      "brand": "Acme",\n      "product_name": "Produto Exemplo 500ml",\n      "owner_tax_id": "00000000000000",\n      "origin_country": "BR",\n      "ncm": "00000000",\n      "cest": "0000000",\n      "gross_weight_value": 0.5,\n      "gross_weight_unit": "kg",\n      "dsit_date": "2025-01-15",\n      "updated_at": "2026-01-16T10:30:00Z",\n      "image_url": "https://example.com/image.jpg"\n    }\n  ]\n}`}
                  statusCodes={[
                    { code: 200, description: "Resultados paginados" },
                    { code: 400, description: "Nenhum filtro informado ou parâmetros inválidos" },
                    { code: 401, description: "API key ausente ou inválida" },
                    { code: 403, description: "Plano sem acesso à API" },
                    { code: 429, description: "Cooldown/rate limit ou quota mensal excedida" },
                  ]}
                />
              </div>
            </section>

            <Separator />

            <section id="rate-limits" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground">Rate limits e quotas</h2>
              <p className="text-foreground leading-relaxed mt-4">
                Existem dois tipos de proteção: <span className="font-semibold">rate limit</span> (picos) e{" "}
                <span className="font-semibold">quota mensal</span> (volume). Além disso, endpoints de batch têm limite
                de itens por requisição.
              </p>

              <div className="mt-6 space-y-6">
                <Card className="p-6">
                  <div className="text-sm font-semibold text-foreground">
                    Lookup (<code className="bg-muted px-2 py-1 rounded text-xs">/v1/gtins/{"{gtin}"}</code> e{" "}
                    <code className="bg-muted px-2 py-1 rounded text-xs">/v1/gtins/batch</code>): requisições por minuto
                  </div>
                  <div className="mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Plano</TableHead>
                          <TableHead>Limite</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>starter</TableCell>
                          <TableCell>60 req/min</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>pro</TableCell>
                          <TableCell>90 req/min</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>advanced</TableCell>
                          <TableCell>120 req/min</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="text-sm font-semibold text-foreground">Batch: limite de GTINs por requisição</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    O batch tem um limite por plano e um hard limit de 100 itens. No{" "}
                    <code className="bg-muted px-2 py-1 rounded text-xs">GET /v1/gtins/batch</code> o limite é 10.
                  </p>
                  <div className="mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Plano</TableHead>
                          <TableHead>Máx. GTINs no POST /batch</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>starter</TableCell>
                          <TableCell>2</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>pro</TableCell>
                          <TableCell>5</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>advanced</TableCell>
                          <TableCell>10</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="text-sm font-semibold text-foreground">Search (/search): cooldown por organização</div>
                  <div className="mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Plano</TableHead>
                          <TableHead>Cooldown</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>starter</TableCell>
                          <TableCell>1 pesquisa a cada 6s</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>pro</TableCell>
                          <TableCell>1 pesquisa a cada 4s</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>advanced</TableCell>
                          <TableCell>1 pesquisa a cada 2s</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="text-sm font-semibold text-foreground">Quota mensal (por organização)</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Cada chamada aos endpoints autenticados consome 1 unidade da quota mensal. Consultas em batch também
                    contam como 1 chamada (independente do número de itens). Ao exceder, a API retorna 429.
                  </p>
                  <div className="mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Plano</TableHead>
                          <TableHead>Limite mensal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>starter</TableCell>
                          <TableCell>5.000</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>pro</TableCell>
                          <TableCell>10.000</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>advanced</TableCell>
                          <TableCell>20.000</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="text-sm font-semibold text-foreground">HTTP 429 (headers)</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Quando o rate limit é excedido, a resposta inclui headers para orientar o retry.
                  </p>
                  <CodeBlock
                    className="mt-4"
                    code={`HTTP/1.1 429 Too Many Requests\nRetry-After: 5\nX-RateLimit-Limit: 60\nX-RateLimit-Remaining: 0\nContent-Type: application/json\n\n{\n  "detail": "Limite de 60 requisições/minuto excedido para seu plano (starter). Aguarde 5s."\n}`}
                  />
                </Card>
                </div>
            </section>

            <Separator />

            <section id="erros" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground">Erros</h2>
              <p className="text-foreground leading-relaxed mt-4">
                Em geral, erros seguem o padrão do FastAPI com a chave <code className="bg-muted px-2 py-1 rounded text-xs">detail</code>.
              </p>
              <Card className="p-6 mt-6">
                <CodeBlock
                  title="Exemplo de erro"
                  code={`{\n  "detail": "Produto com GTIN '7891234567890' não encontrado"\n}`}
                />
              </Card>
            </section>

            <Separator />

            <section id="exemplos" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground">Exemplos</h2>
              <p className="text-foreground leading-relaxed mt-4">
                Snippets prontos para copiar e colar.
              </p>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <Card className="p-6">
                  <div className="text-sm font-semibold text-foreground">JavaScript (fetch)</div>
                  <CodeBlock
                    className="mt-4"
                    code={`const res = await fetch("${baseUrl}/v1/gtins/7891234567890", {\n  headers: {\n    "X-API-Key": "SUA_CHAVE_API",\n  },\n});\n\nif (!res.ok) throw new Error(await res.text());\nconst data = await res.json();\nconsole.log(data);`}
                  />
                </Card>

                <Card className="p-6">
                  <div className="text-sm font-semibold text-foreground">Python (requests)</div>
                  <CodeBlock
                    className="mt-4"
                    code={`import requests\n\nres = requests.get(\n  "${baseUrl}/v1/gtins/7891234567890",\n  headers={\"X-API-Key\": \"SUA_CHAVE_API\"},\n)\nres.raise_for_status()\nprint(res.json())`}
                  />
                </Card>
              </div>
            </section>
                </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <Card className="p-5">
                <Toc items={tocItems} />
              </Card>
              <Card className="p-5">
                <div className="text-sm font-semibold text-foreground">Dicas rápidas</div>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>
                    Use <code className="bg-muted px-2 py-1 rounded text-xs">POST /batch</code> para lotes maiores (até o
                    limite do seu plano; hard limit 100).
                  </li>
                  <li>
                    Use <code className="bg-muted px-2 py-1 rounded text-xs">GET /batch</code> (máx. 10) quando quiser
                    cachear facilmente.
                  </li>
                  <li>
                    Em <code className="bg-muted px-2 py-1 rounded text-xs">/search</code>, respeite o cooldown para
                    evitar 429.
                  </li>
                </ul>
              </Card>
            </div>
          </aside>
        </div>
      </main>

      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>Precisa de ajuda? Entre em contato com nossa equipe de suporte para assistência com a GTIN API.</p>
        </div>
      </footer>
    </div>
  )
}