import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-foreground">GTIN API</h1>
          <p className="text-muted-foreground mt-2">API de dados de produtos para consultas de GTIN</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="space-y-12">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Introdução</h2>
            <p className="text-foreground leading-relaxed">
              A GTIN API permite que você recupere informações de produtos usando Números Globais de Item Comercial
              (GTIN). GTINs são identificadores únicos para produtos que incluem formatos como UPC, EAN e ISBN. Esta API
              suporta GTINs de 8, 12, 13 e 14 dígitos.
            </p>
          </section>

          {/* Authentication */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Autenticação</h2>
            <p className="text-foreground leading-relaxed mb-4">
              Todas as requisições da API requerem autenticação usando uma chave de API. Você pode autenticar suas
              requisições usando qualquer um dos seguintes métodos:
            </p>

            <Card className="p-6 bg-muted/50">
              <h3 className="font-semibold text-foreground mb-3">Cabeçalho de Autorização</h3>
              <pre className="bg-background p-4 rounded-lg overflow-x-auto">
                <code className="text-sm text-foreground">{`Authorization: Bearer SUA_CHAVE_API`}</code>
              </pre>

              <h3 className="font-semibold text-foreground mt-6 mb-3">Cabeçalho Personalizado</h3>
              <pre className="bg-background p-4 rounded-lg overflow-x-auto">
                <code className="text-sm text-foreground">{`X-API-Key: SUA_CHAVE_API`}</code>
              </pre>
            </Card>

            <div className="mt-4 p-4 bg-accent rounded-lg border border-border">
              <p className="text-sm text-accent-foreground">
                <strong>Limite de Taxa:</strong> Cada consulta de GTIN consome 1 crédito da sua cota diária. Requisições
                em lote consomem créditos proporcionalmente ao número de GTINs na requisição.
              </p>
            </div>
          </section>

          {/* Endpoints */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-6">Endpoints</h2>

            {/* Single GTIN Lookup */}
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Badge className="bg-primary text-primary-foreground">GET</Badge>
                  <code className="text-lg font-mono text-foreground">/v1/gtins/{"{gtin}"}</code>
                </div>

                <p className="text-foreground leading-relaxed mb-4">
                  Recupere informações do produto para um único GTIN.
                </p>

                <h4 className="font-semibold text-foreground mb-2">Parâmetros</h4>
                <ul className="list-disc list-inside text-foreground mb-4 space-y-1">
                  <li>
                    <code className="bg-muted px-2 py-1 rounded text-sm">gtin</code> - O GTIN a ser consultado (8, 12,
                    13 ou 14 dígitos). Caracteres não numéricos são ignorados.
                  </li>
                </ul>

                <Tabs defaultValue="request" className="mt-6">
                  <TabsList>
                    <TabsTrigger value="request">Requisição</TabsTrigger>
                    <TabsTrigger value="response">Resposta</TabsTrigger>
                  </TabsList>

                  <TabsContent value="request" className="mt-4">
                    <pre className="bg-background p-4 rounded-lg overflow-x-auto border border-border">
                      <code className="text-sm text-foreground">
                        {`curl -X GET "https://api.example.com/v1/gtins/7891234567890" \\
  -H "Authorization: Bearer SUA_CHAVE_API"`}
                      </code>
                    </pre>
                  </TabsContent>

                  <TabsContent value="response" className="mt-4">
                    <pre className="bg-background p-4 rounded-lg overflow-x-auto border border-border">
                      <code className="text-sm text-foreground">
                        {`{
  "gtin": "7891234567890",
  "name": "Nome do Produto",
  "brand": "Nome da Marca",
  "category": "Categoria",
  "description": "Descrição do produto",
  "imageUrl": "https://example.com/image.jpg",
  "manufacturer": "Nome do Fabricante",
  "lastUpdated": "2025-01-15T10:30:00Z"
}`}
                      </code>
                    </pre>
                  </TabsContent>
                </Tabs>

                <h4 className="font-semibold text-foreground mt-6 mb-2">Códigos de Resposta</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      200
                    </Badge>
                    <span className="text-foreground">Produto encontrado com sucesso</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                      400
                    </Badge>
                    <span className="text-foreground">Formato de GTIN inválido</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                      401
                    </Badge>
                    <span className="text-foreground">Chave de API inválida ou ausente</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                      404
                    </Badge>
                    <span className="text-foreground">Produto não encontrado</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                      429
                    </Badge>
                    <span className="text-foreground">Limite diário de taxa excedido</span>
                  </div>
                </div>
              </Card>

              {/* Batch Lookup */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Badge className="bg-blue-600 text-white">POST</Badge>
                  <code className="text-lg font-mono text-foreground">/v1/gtins:batch</code>
                </div>

                <p className="text-foreground leading-relaxed mb-4">
                  Recupere informações de produtos para múltiplos GTINs em uma única requisição.
                </p>

                <div className="p-4 bg-accent rounded-lg border border-border mb-4">
                  <p className="text-sm text-accent-foreground">
                    <strong>Limites:</strong> Máximo de 100 GTINs por requisição. Cada GTIN conta para sua cota diária.
                  </p>
                </div>

                <Tabs defaultValue="request" className="mt-6">
                  <TabsList>
                    <TabsTrigger value="request">Requisição</TabsTrigger>
                    <TabsTrigger value="response">Resposta</TabsTrigger>
                  </TabsList>

                  <TabsContent value="request" className="mt-4">
                    <pre className="bg-background p-4 rounded-lg overflow-x-auto border border-border">
                      <code className="text-sm text-foreground">
                        {`curl -X POST "https://api.example.com/v1/gtins:batch" \\
  -H "Authorization: Bearer SUA_CHAVE_API" \\
  -H "Content-Type: application/json" \\
  -d '{
    "gtins": [
      "7891234567890",
      "0012345678905",
      "9780134685991"
    ]
  }'`}
                      </code>
                    </pre>
                  </TabsContent>

                  <TabsContent value="response" className="mt-4">
                    <pre className="bg-background p-4 rounded-lg overflow-x-auto border border-border">
                      <code className="text-sm text-foreground">
                        {`{
  "results": [
    {
      "gtin": "7891234567890",
      "status": "found",
      "data": {
        "name": "Nome do Produto 1",
        "brand": "Marca A",
        "category": "Categoria"
      }
    },
    {
      "gtin": "0012345678905",
      "status": "found",
      "data": {
        "name": "Nome do Produto 2",
        "brand": "Marca B",
        "category": "Categoria"
      }
    },
    {
      "gtin": "9780134685991",
      "status": "not_found",
      "data": null
    }
  ],
  "totalRequested": 3,
  "totalFound": 2,
  "creditsConsumed": 3
}`}
                      </code>
                    </pre>
                  </TabsContent>
                </Tabs>

                <h4 className="font-semibold text-foreground mt-6 mb-2">Comportamento em Lote</h4>
                <ul className="list-disc list-inside text-foreground space-y-1">
                  <li>Os resultados mantêm a ordem dos GTINs na requisição</li>
                  <li>
                    GTINs não encontrados retornam{" "}
                    <code className="bg-muted px-2 py-1 rounded text-sm">status: "not_found"</code> com{" "}
                    <code className="bg-muted px-2 py-1 rounded text-sm">data: null</code>
                  </li>
                  <li>
                    GTINs inválidos retornam{" "}
                    <code className="bg-muted px-2 py-1 rounded text-sm">status: "invalid"</code>
                  </li>
                  <li>Falhas parciais não interrompem a requisição inteira</li>
                </ul>
              </Card>
            </div>
          </section>

          {/* Error Handling */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Tratamento de Erros</h2>
            <p className="text-foreground leading-relaxed mb-4">
              A API usa códigos de status HTTP padrão para indicar sucesso ou falha. Todas as respostas de erro incluem
              um corpo JSON com detalhes adicionais:
            </p>

            <Card className="p-6 bg-muted/50">
              <pre className="bg-background p-4 rounded-lg overflow-x-auto">
                <code className="text-sm text-foreground">
                  {`{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Limite diário de taxa excedido. Reinicia em 2025-01-16T00:00:00Z",
    "details": {
      "limit": 1000,
      "used": 1000,
      "resetAt": "2025-01-16T00:00:00Z"
    }
  }
}`}
                </code>
              </pre>
            </Card>
          </section>

          {/* Examples */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Exemplos de Código</h2>

            <Tabs defaultValue="javascript" className="mt-6">
              <TabsList>
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="curl">cURL</TabsTrigger>
              </TabsList>

              <TabsContent value="javascript" className="mt-4">
                <pre className="bg-background p-4 rounded-lg overflow-x-auto border border-border">
                  <code className="text-sm text-foreground">
                    {`// Consulta de GTIN único
const response = await fetch('https://api.example.com/v1/gtins/7891234567890', {
  headers: {
    'Authorization': 'Bearer SUA_CHAVE_API'
  }
});

const product = await response.json();
console.log(product);

// Consulta em lote
const batchResponse = await fetch('https://api.example.com/v1/gtins:batch', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer SUA_CHAVE_API',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    gtins: ['7891234567890', '0012345678905']
  })
});

const batchResults = await batchResponse.json();
console.log(batchResults);`}
                  </code>
                </pre>
              </TabsContent>

              <TabsContent value="python" className="mt-4">
                <pre className="bg-background p-4 rounded-lg overflow-x-auto border border-border">
                  <code className="text-sm text-foreground">
                    {`import requests

# Consulta de GTIN único
response = requests.get(
    'https://api.example.com/v1/gtins/7891234567890',
    headers={'Authorization': 'Bearer SUA_CHAVE_API'}
)

product = response.json()
print(product)

# Consulta em lote
batch_response = requests.post(
    'https://api.example.com/v1/gtins:batch',
    headers={
        'Authorization': 'Bearer SUA_CHAVE_API',
        'Content-Type': 'application/json'
    },
    json={'gtins': ['7891234567890', '0012345678905']}
)

batch_results = batch_response.json()
print(batch_results)`}
                  </code>
                </pre>
              </TabsContent>

              <TabsContent value="curl" className="mt-4">
                <pre className="bg-background p-4 rounded-lg overflow-x-auto border border-border">
                  <code className="text-sm text-foreground">
                    {`# Consulta de GTIN único
curl -X GET "https://api.example.com/v1/gtins/7891234567890" \\
  -H "Authorization: Bearer SUA_CHAVE_API"

# Consulta em lote
curl -X POST "https://api.example.com/v1/gtins:batch" \\
  -H "Authorization: Bearer SUA_CHAVE_API" \\
  -H "Content-Type: application/json" \\
  -d '{
    "gtins": ["7891234567890", "0012345678905"]
  }'`}
                  </code>
                </pre>
              </TabsContent>
            </Tabs>
          </section>

          {/* Rate Limits */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Limites de Taxa e Cotas</h2>
            <Card className="p-6">
              <ul className="space-y-3 text-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-primary font-semibold min-w-[120px]">Cota Diária:</span>
                  <span>Cada chave de API tem um limite diário no número de consultas de GTIN</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-semibold min-w-[120px]">Hora de Reset:</span>
                  <span>As cotas são reiniciadas às 00:00:00 UTC diariamente</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-semibold min-w-[120px]">Limite em Lote:</span>
                  <span>Máximo de 100 GTINs por requisição em lote</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-semibold min-w-[120px]">Cabeçalhos:</span>
                  <span>
                    Verifique o cabeçalho de resposta{" "}
                    <code className="bg-muted px-2 py-1 rounded text-sm">X-RateLimit-Remaining</code> para cota restante
                  </span>
                </li>
              </ul>
            </Card>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>Precisa de ajuda? Entre em contato com nossa equipe de suporte para assistência com a GTIN API.</p>
        </div>
      </footer>
    </div>
  )
}
