import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Documentação da API GTIN</h1>
              <p className="text-muted-foreground mt-2">API completa de consulta de produtos por GTIN com dados brasileiros</p>
            </div>
            <Link href="/dashboard" className="text-primary hover:underline">
              Voltar ao Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="space-y-12">
          {/* Table of Contents */}
          <section className="bg-muted/30 p-6 rounded-lg border">
            <h3 className="font-bold text-lg mb-3">Navegação Rápida</h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <a href="#introducao" className="text-primary hover:underline">1. Introdução</a>
              <a href="#autenticacao" className="text-primary hover:underline">2. Autenticação</a>
              <a href="#rate-limits" className="text-primary hover:underline">3. Rate Limits por Plano</a>
              <a href="#endpoints" className="text-primary hover:underline">4. Endpoints</a>
              <a href="#exemplos" className="text-primary hover:underline">5. Exemplos de Código</a>
              <a href="#erros" className="text-primary hover:underline">6. Tratamento de Erros</a>
              <a href="#planos" className="text-primary hover:underline">7. Planos e Limites</a>
              <a href="#boas-praticas" className="text-primary hover:underline">8. Melhores Práticas</a>
            </div>
          </section>

          {/* Introduction */}
          <section id="introducao">
            <h2 className="text-3xl font-bold text-foreground mb-4 border-b pb-2">1. Introdução</h2>
            <p className="text-foreground leading-relaxed mb-4">
              A <strong>GTIN API</strong> é uma API REST completa que permite consultar informações detalhadas de produtos
              usando códigos de barras GTIN (Global Trade Item Number). Nossa API oferece acesso a uma base de dados
              abrangente de produtos brasileiros com informações oficiais do Cadastro Nacional de Produtos (CNP).
            </p>
            
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <Card className="p-5">
                <h4 className="font-semibold text-foreground mb-2">✓ Formatos Suportados</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• GTIN-8 (EAN-8): 8 dígitos</li>
                  <li>• GTIN-12 (UPC-A): 12 dígitos</li>
                  <li>• GTIN-13 (EAN-13): 13 dígitos</li>
                  <li>• GTIN-14 (ITF-14): 14 dígitos</li>
                </ul>
              </Card>
              
              <Card className="p-5">
                <h4 className="font-semibold text-foreground mb-2">✓ Dados Disponíveis</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Nome e marca do produto</li>
                  <li>• NCM e CEST (classificações fiscais)</li>
                  <li>• País de origem e CNPJ do titular</li>
                  <li>• Peso bruto e imagem do produto</li>
                </ul>
              </Card>
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-foreground">
                <strong>Base URL:</strong> <code className="bg-background px-2 py-1 rounded">https://gtinapi.com.br/api</code>
              </p>
            </div>
          </section>

          {/* Authentication */}
          <section id="autenticacao">
            <h2 className="text-3xl font-bold text-foreground mb-4 border-b pb-2">2. Autenticação</h2>
            <p className="text-foreground leading-relaxed mb-4">
              Todas as requisições à API requerem autenticação usando uma <strong>API Key</strong> única. Você pode 
              gerar e gerenciar suas chaves de API no seu dashboard após criar uma conta.
            </p>

            <Card className="p-6 bg-muted/50">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="text-primary">•</span> Método 1: Cabeçalho Authorization (Recomendado)
              </h3>
              <pre className="bg-background p-4 rounded-lg overflow-x-auto border">
                <code className="text-sm text-foreground">{`Authorization: Bearer sua-api-key-aqui`}</code>
              </pre>

              <h3 className="font-semibold text-foreground mt-6 mb-3 flex items-center gap-2">
                <span className="text-primary">•</span> Método 2: Cabeçalho X-API-Key
              </h3>
              <pre className="bg-background p-4 rounded-lg overflow-x-auto border">
                <code className="text-sm text-foreground">{`X-API-Key: sua-api-key-aqui`}</code>
              </pre>
            </Card>

            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">✓ Segurança</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Mantenha sua API key em segredo</li>
                  <li>• Use variáveis de ambiente</li>
                  <li>• Não exponha em código cliente</li>
                  <li>• Regenere se comprometida</li>
                </ul>
              </div>
              
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">ℹ️ Informações</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Cada organização pode ter múltiplas keys</li>
                  <li>• Keys podem ser ativadas/desativadas</li>
                  <li>• Uso individual rastreado por key</li>
                  <li>• Limites aplicados por organização</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Rate Limits */}
          <section id="rate-limits">
            <h2 className="text-3xl font-bold text-foreground mb-4 border-b pb-2">3. Rate Limits por Plano</h2>
            <p className="text-foreground leading-relaxed mb-6">
              Os limites de requisição variam de acordo com seu plano de assinatura. Nossa API implementa dois tipos 
              de rate limiting para diferentes tipos de endpoints:
            </p>

            {/* Lookup Endpoints Rate Limits */}
            <Card className="p-6 mb-6">
              <h3 className="font-bold text-xl text-foreground mb-4">Endpoints de Lookup (/{"{gtin}"} e /batch)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Limite baseado em requisições por minuto usando janela deslizante (sliding window)
              </p>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Plano</th>
                      <th className="text-left py-3 px-4 font-semibold">Requisições/Minuto</th>
                      <th className="text-left py-3 px-4 font-semibold">Limite Mensal</th>
                      <th className="text-left py-3 px-4 font-semibold">Batch Limit</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b hover:bg-muted/30">
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="bg-gray-100">Basic</Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">-</td>
                      <td className="py-3 px-4 text-muted-foreground">Sem acesso à API</td>
                      <td className="py-3 px-4 text-muted-foreground">-</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/30">
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="bg-blue-100 text-blue-700">Starter</Badge>
                      </td>
                      <td className="py-3 px-4 font-semibold">60 req/min</td>
                      <td className="py-3 px-4">1.000 chamadas/mês</td>
                      <td className="py-3 px-4">Até 2 GTINs</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/30">
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="bg-purple-100 text-purple-700">Pro</Badge>
                      </td>
                      <td className="py-3 px-4 font-semibold">90 req/min</td>
                      <td className="py-3 px-4">10.000 chamadas/mês</td>
                      <td className="py-3 px-4">Até 5 GTINs</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/30">
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="bg-amber-100 text-amber-700">Advanced</Badge>
                      </td>
                      <td className="py-3 px-4 font-semibold">120 req/min</td>
                      <td className="py-3 px-4">Ilimitado</td>
                      <td className="py-3 px-4">Até 10 GTINs</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Search Endpoint Rate Limits */}
            <Card className="p-6 mb-6">
              <h3 className="font-bold text-xl text-foreground mb-4">Endpoint de Busca (/search)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Limite baseado em cooldown (tempo mínimo entre requisições)
              </p>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Plano</th>
                      <th className="text-left py-3 px-4 font-semibold">Cooldown</th>
                      <th className="text-left py-3 px-4 font-semibold">Requisições/Hora (aprox.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b hover:bg-muted/30">
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="bg-gray-100">Basic</Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">-</td>
                      <td className="py-3 px-4 text-muted-foreground">Sem acesso</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/30">
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="bg-blue-100 text-blue-700">Starter</Badge>
                      </td>
                      <td className="py-3 px-4 font-semibold">6 segundos</td>
                      <td className="py-3 px-4">~600 req/hora</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/30">
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="bg-purple-100 text-purple-700">Pro</Badge>
                      </td>
                      <td className="py-3 px-4 font-semibold">4 segundos</td>
                      <td className="py-3 px-4">~900 req/hora</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/30">
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="bg-amber-100 text-amber-700">Advanced</Badge>
                      </td>
                      <td className="py-3 px-4 font-semibold">2 segundos</td>
                      <td className="py-3 px-4">~1.800 req/hora</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Response Headers */}
            <div className="p-5 bg-muted/30 rounded-lg border">
              <h4 className="font-semibold text-foreground mb-3">📊 Headers de Rate Limit nas Respostas</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Quando você atinge um limite, a API retorna status <code className="bg-background px-2 py-1 rounded">429 Too Many Requests</code> com os seguintes headers:
              </p>
              <div className="grid md:grid-cols-3 gap-3 text-sm">
                <div>
                  <code className="bg-background px-2 py-1 rounded block mb-1">X-RateLimit-Limit</code>
                  <span className="text-muted-foreground">Limite total</span>
                </div>
                <div>
                  <code className="bg-background px-2 py-1 rounded block mb-1">X-RateLimit-Remaining</code>
                  <span className="text-muted-foreground">Requisições restantes</span>
                </div>
                <div>
                  <code className="bg-background px-2 py-1 rounded block mb-1">Retry-After</code>
                  <span className="text-muted-foreground">Segundos até poder tentar novamente</span>
                </div>
              </div>
            </div>
          </section>

          {/* Endpoints */}
          <section id="endpoints">
            <h2 className="text-3xl font-bold text-foreground mb-6 border-b pb-2">4. Endpoints da API</h2>

            <div className="space-y-8">
              {/* Endpoint 1: Single GTIN Lookup */}
              <Card className="p-6 border-2">
                <div className="flex items-center gap-3 mb-4">
                  <Badge className="bg-emerald-600 text-white px-3 py-1">GET</Badge>
                  <code className="text-lg font-mono text-foreground">/v1/gtins/{"{gtin}"}</code>
                </div>

                <p className="text-foreground leading-relaxed mb-4">
                  Consulta informações detalhadas de um produto através do seu código GTIN. Este é o endpoint mais comum 
                  para consultas individuais.
                </p>

                <div className="space-y-4 mb-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Parâmetros de URL</h4>
                    <div className="bg-muted/30 p-3 rounded">
                      <code className="text-sm">gtin</code> <span className="text-muted-foreground text-sm">(obrigatório)</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        Código GTIN do produto (8, 12, 13 ou 14 dígitos). Caracteres não numéricos são automaticamente removidos.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Headers Obrigatórios</h4>
                    <div className="bg-muted/30 p-3 rounded space-y-2">
                      <div>
                        <code className="text-sm">Authorization: Bearer {"{sua-api-key}"}</code>
                        <p className="text-xs text-muted-foreground mt-1">ou</p>
                        <code className="text-sm">X-API-Key: {"{sua-api-key}"}</code>
                      </div>
                    </div>
                  </div>
                </div>

                <Tabs defaultValue="curl" className="mt-6">
                  <TabsList>
                    <TabsTrigger value="curl">cURL</TabsTrigger>
                    <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                    <TabsTrigger value="python">Python</TabsTrigger>
                    <TabsTrigger value="response">Resposta</TabsTrigger>
                  </TabsList>

                  <TabsContent value="curl" className="mt-4">
                    <pre className="bg-background p-4 rounded-lg overflow-x-auto border">
                      <code className="text-sm text-foreground">
{`curl -X GET "https://gtinapi.com.br/api/v1/gtins/7891234567890" \\
  -H "Authorization: Bearer sua-api-key-aqui"`}
                      </code>
                    </pre>
                  </TabsContent>

                  <TabsContent value="javascript" className="mt-4">
                    <pre className="bg-background p-4 rounded-lg overflow-x-auto border">
                      <code className="text-sm text-foreground">
{`const response = await fetch('https://gtinapi.com.br/api/v1/gtins/7891234567890', {
  headers: {
    'Authorization': 'Bearer sua-api-key-aqui'
  }
});

const product = await response.json();
console.log(product);`}
                      </code>
                    </pre>
                  </TabsContent>

                  <TabsContent value="python" className="mt-4">
                    <pre className="bg-background p-4 rounded-lg overflow-x-auto border">
                      <code className="text-sm text-foreground">
{`import requests

response = requests.get(
    'https://gtinapi.com.br/api/v1/gtins/7891234567890',
    headers={'Authorization': 'Bearer sua-api-key-aqui'}
)

product = response.json()
print(product)`}
                      </code>
                    </pre>
                  </TabsContent>

                  <TabsContent value="response" className="mt-4">
                    <pre className="bg-background p-4 rounded-lg overflow-x-auto border">
                      <code className="text-sm text-foreground">
{`{
  "gtin": "7891234567890",
  "gtin_type": "GTIN-13",
  "brand": "NESTLE",
  "product_name": "Chocolate NESTLE Classic 90g",
  "owner_tax_id": "60.409.075/0001-52",
  "origin_country": "Brasil",
  "ncm": "18063210",
  "cest": "1700900",
  "gross_weight_value": 95.0,
  "gross_weight_unit": "g",
  "dsit_date": "2023-05-15",
  "updated_at": "2025-01-15T10:30:00Z",
  "image_url": "https://cdn.gtinapi.com.br/images/7891234567890.jpg"
}`}
                      </code>
                    </pre>
                  </TabsContent>
                </Tabs>

                <div className="mt-6 space-y-2">
                  <h4 className="font-semibold text-foreground mb-3">Códigos de Resposta HTTP</h4>
                  <div className="grid gap-2">
                    <div className="flex items-start gap-3 p-2 rounded hover:bg-muted/30">
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">200</Badge>
                      <div>
                        <span className="text-foreground font-medium">OK</span>
                        <p className="text-sm text-muted-foreground">Produto encontrado com sucesso</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-2 rounded hover:bg-muted/30">
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">400</Badge>
                      <div>
                        <span className="text-foreground font-medium">Bad Request</span>
                        <p className="text-sm text-muted-foreground">GTIN inválido (deve conter apenas números)</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-2 rounded hover:bg-muted/30">
                      <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">401</Badge>
                      <div>
                        <span className="text-foreground font-medium">Unauthorized</span>
                        <p className="text-sm text-muted-foreground">API key inválida ou não fornecida</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-2 rounded hover:bg-muted/30">
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">403</Badge>
                      <div>
                        <span className="text-foreground font-medium">Forbidden</span>
                        <p className="text-sm text-muted-foreground">Plano não permite consultas de API (upgrade necessário)</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-2 rounded hover:bg-muted/30">
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">404</Badge>
                      <div>
                        <span className="text-foreground font-medium">Not Found</span>
                        <p className="text-sm text-muted-foreground">Produto não encontrado na base de dados</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-2 rounded hover:bg-muted/30">
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20">429</Badge>
                      <div>
                        <span className="text-foreground font-medium">Too Many Requests</span>
                        <p className="text-sm text-muted-foreground">Rate limit excedido (veja header Retry-After)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Endpoint 2: POST Batch Lookup */}
              <Card className="p-6 border-2">
                <div className="flex items-center gap-3 mb-4">
                  <Badge className="bg-blue-600 text-white px-3 py-1">POST</Badge>
                  <code className="text-lg font-mono text-foreground">/v1/gtins/batch</code>
                </div>

                <p className="text-foreground leading-relaxed mb-4">
                  Consulta múltiplos produtos em uma única requisição via POST. Ideal para processar listas grandes de GTINs.
                </p>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">✓ Vantagens</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Processa até 100 GTINs por requisição</li>
                      <li>• Conta como 1 chamada de API</li>
                      <li>• Mais eficiente que múltiplas requisições</li>
                      <li>• Suporta corpos de requisição grandes</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">⚠️ Limites por Plano</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• <strong>Starter:</strong> até 2 GTINs por batch</li>
                      <li>• <strong>Pro:</strong> até 5 GTINs por batch</li>
                      <li>• <strong>Advanced:</strong> até 10 GTINs por batch</li>
                      <li>• <strong>Hard limit:</strong> 100 GTINs (todos os planos)</li>
                    </ul>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold text-foreground mb-2">Corpo da Requisição (JSON)</h4>
                  <pre className="bg-muted/30 p-4 rounded text-sm">
                    <code>{`{
  "gtins": ["7891234567890", "0012345678905", "9780134685991"]
}`}</code>
                  </pre>
                </div>

                <Tabs defaultValue="curl" className="mt-6">
                  <TabsList>
                    <TabsTrigger value="curl">cURL</TabsTrigger>
                    <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                    <TabsTrigger value="python">Python</TabsTrigger>
                    <TabsTrigger value="response">Resposta</TabsTrigger>
                  </TabsList>

                  <TabsContent value="curl" className="mt-4">
                    <pre className="bg-background p-4 rounded-lg overflow-x-auto border">
                      <code className="text-sm text-foreground">
{`curl -X POST "https://gtinapi.com.br/api/v1/gtins/batch" \\
  -H "Authorization: Bearer sua-api-key-aqui" \\
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

                  <TabsContent value="javascript" className="mt-4">
                    <pre className="bg-background p-4 rounded-lg overflow-x-auto border">
                      <code className="text-sm text-foreground">
{`const response = await fetch('https://gtinapi.com.br/api/v1/gtins/batch', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sua-api-key-aqui',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    gtins: ['7891234567890', '0012345678905', '9780134685991']
  })
});

const batchResults = await response.json();
console.log(batchResults);`}
                      </code>
                    </pre>
                  </TabsContent>

                  <TabsContent value="python" className="mt-4">
                    <pre className="bg-background p-4 rounded-lg overflow-x-auto border">
                      <code className="text-sm text-foreground">
{`import requests

response = requests.post(
    'https://gtinapi.com.br/api/v1/gtins/batch',
    headers={
        'Authorization': 'Bearer sua-api-key-aqui',
        'Content-Type': 'application/json'
    },
    json={'gtins': ['7891234567890', '0012345678905', '9780134685991']}
)

batch_results = response.json()
print(batch_results)`}
                      </code>
                    </pre>
                  </TabsContent>

                  <TabsContent value="response" className="mt-4">
                    <pre className="bg-background p-4 rounded-lg overflow-x-auto border">
                      <code className="text-sm text-foreground">
{`{
  "total_requested": 3,
  "total_found": 2,
  "results": [
    {
      "gtin": "7891234567890",
      "found": true,
      "product": {
        "gtin": "7891234567890",
        "gtin_type": "GTIN-13",
        "brand": "NESTLE",
        "product_name": "Chocolate NESTLE Classic 90g",
        "ncm": "18063210",
        "origin_country": "Brasil"
      }
    },
    {
      "gtin": "0012345678905",
      "found": true,
      "product": {
        "gtin": "0012345678905",
        "gtin_type": "GTIN-12",
        "brand": "KRAFT",
        "product_name": "Queijo Cheddar",
        "ncm": "04069000"
      }
    },
    {
      "gtin": "9780134685991",
      "found": false,
      "product": null
    }
  ]
}`}
                      </code>
                    </pre>
                  </TabsContent>
                </Tabs>

                <div className="mt-6">
                  <h4 className="font-semibold text-foreground mb-3">Comportamento do Endpoint</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Os resultados mantêm a mesma ordem dos GTINs enviados</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>GTINs encontrados retornam <code className="bg-muted px-2 py-0.5 rounded">found: true</code> com dados do produto</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>GTINs não encontrados retornam <code className="bg-muted px-2 py-0.5 rounded">found: false</code> e <code className="bg-muted px-2 py-0.5 rounded">product: null</code></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>GTINs inválidos (não numéricos após normalização) também retornam <code className="bg-muted px-2 py-0.5 rounded">found: false</code></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>A requisição inteira conta como 1 chamada de API (independente do número de GTINs)</span>
                    </li>
                  </ul>
                </div>
              </Card>

              {/* Endpoint 3: GET Batch Lookup */}
              <Card className="p-6 border-2">
                <div className="flex items-center gap-3 mb-4">
                  <Badge className="bg-emerald-600 text-white px-3 py-1">GET</Badge>
                  <code className="text-lg font-mono text-foreground">/v1/gtins/batch</code>
                </div>

                <p className="text-foreground leading-relaxed mb-4">
                  Consulta múltiplos produtos via query parameters. Ideal para URLs compartilháveis e cacheamento por CDN.
                </p>

                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-6">
                  <h4 className="font-semibold text-foreground mb-2">🚀 Vantagens do GET</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• <strong>Cacheável:</strong> Respostas podem ser cacheadas por CDN/browsers</li>
                    <li>• <strong>Compartilhável:</strong> URLs podem ser copiadas e compartilhadas</li>
                    <li>• <strong>Limite:</strong> Máximo de 10 GTINs (mais que suficiente para a maioria dos casos)</li>
                    <li>• <strong>Headers de cache:</strong> <code className="bg-background px-2 py-0.5 rounded">Cache-Control: private, max-age=3600</code></li>
                  </ul>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold text-foreground mb-2">Query Parameters</h4>
                  <div className="bg-muted/30 p-3 rounded">
                    <code className="text-sm">gtin</code> <span className="text-muted-foreground text-sm">(repetível, obrigatório)</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      Repita o parâmetro <code className="bg-background px-1 rounded">gtin</code> para cada GTIN que deseja consultar.
                      Máximo de 10 GTINs.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Exemplo: <code className="bg-background px-2 py-0.5 rounded">?gtin=123&gtin=456&gtin=789</code>
                    </p>
                  </div>
                </div>

                <Tabs defaultValue="curl" className="mt-6">
                  <TabsList>
                    <TabsTrigger value="curl">cURL</TabsTrigger>
                    <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                    <TabsTrigger value="python">Python</TabsTrigger>
                    <TabsTrigger value="response">Resposta</TabsTrigger>
                  </TabsList>

                  <TabsContent value="curl" className="mt-4">
                    <pre className="bg-background p-4 rounded-lg overflow-x-auto border">
                      <code className="text-sm text-foreground">
{`curl -X GET "https://gtinapi.com.br/api/v1/gtins/batch?gtin=7891234567890&gtin=0012345678905" \\
  -H "Authorization: Bearer sua-api-key-aqui"`}
                      </code>
                    </pre>
                  </TabsContent>

                  <TabsContent value="javascript" className="mt-4">
                    <pre className="bg-background p-4 rounded-lg overflow-x-auto border">
                      <code className="text-sm text-foreground">
{`const gtins = ['7891234567890', '0012345678905'];
const params = new URLSearchParams();
gtins.forEach(gtin => params.append('gtin', gtin));

const response = await fetch(\`https://gtinapi.com.br/api/v1/gtins/batch?\${params}\`, {
  headers: {
    'Authorization': 'Bearer sua-api-key-aqui'
  }
});

const results = await response.json();
console.log(results);`}
                      </code>
                    </pre>
                  </TabsContent>

                  <TabsContent value="python" className="mt-4">
                    <pre className="bg-background p-4 rounded-lg overflow-x-auto border">
                      <code className="text-sm text-foreground">
{`import requests

gtins = ['7891234567890', '0012345678905']
params = [('gtin', gtin) for gtin in gtins]

response = requests.get(
    'https://gtinapi.com.br/api/v1/gtins/batch',
    params=params,
    headers={'Authorization': 'Bearer sua-api-key-aqui'}
)

results = response.json()
print(results)`}
                      </code>
                    </pre>
                  </TabsContent>

                  <TabsContent value="response" className="mt-4">
                    <pre className="bg-background p-4 rounded-lg overflow-x-auto border">
                      <code className="text-sm text-foreground">
{`{
  "total_requested": 2,
  "total_found": 2,
  "results": [
    {
      "gtin": "7891234567890",
      "found": true,
      "product": {
        "gtin": "7891234567890",
        "brand": "NESTLE",
        "product_name": "Chocolate NESTLE Classic 90g"
      }
    },
    {
      "gtin": "0012345678905",
      "found": true,
      "product": {
        "gtin": "0012345678905",
        "brand": "KRAFT",
        "product_name": "Queijo Cheddar"
      }
    }
  ]
}`}
                      </code>
                    </pre>
                  </TabsContent>
                </Tabs>
              </Card>

              {/* Endpoint 4: Search */}
              <Card className="p-6 border-2">
                <div className="flex items-center gap-3 mb-4">
                  <Badge className="bg-purple-600 text-white px-3 py-1">GET</Badge>
                  <code className="text-lg font-mono text-foreground">/v1/gtins/search</code>
                </div>

                <p className="text-foreground leading-relaxed mb-4">
                  Busca produtos por marca, nome ou NCM. Retorna resultados paginados com limite fixo de 10 itens por página.
                </p>

                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-6">
                  <h4 className="font-semibold text-foreground mb-2">⏱️ Rate Limit Especial</h4>
                  <p className="text-sm text-muted-foreground">
                    Este endpoint usa cooldown (tempo entre requisições) em vez de requisições por minuto, devido ao custo 
                    computacional das buscas no banco de dados.
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <h4 className="font-semibold text-foreground">Query Parameters</h4>
                  
                  <div className="space-y-3">
                    <div className="bg-muted/30 p-3 rounded">
                      <code className="text-sm">brand</code> <span className="text-muted-foreground text-sm">(opcional)</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        Busca por marca (case-insensitive, suporta busca parcial com ILIKE)
                      </p>
                    </div>
                    
                    <div className="bg-muted/30 p-3 rounded">
                      <code className="text-sm">product_name</code> <span className="text-muted-foreground text-sm">(opcional)</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        Busca por nome do produto (case-insensitive, suporta busca parcial com ILIKE)
                      </p>
                    </div>
                    
                    <div className="bg-muted/30 p-3 rounded">
                      <code className="text-sm">ncm</code> <span className="text-muted-foreground text-sm">(opcional)</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        Busca por código NCM exato (match exato, não parcial)
                      </p>
                    </div>
                    
                    <div className="bg-muted/30 p-3 rounded">
                      <code className="text-sm">offset</code> <span className="text-muted-foreground text-sm">(opcional, padrão: 0)</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        Número de registros a pular para paginação (use múltiplos de 10)
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded">
                    <p className="text-sm text-foreground">
                      <strong>Importante:</strong> Pelo menos um filtro (brand, product_name ou ncm) deve ser fornecido.
                    </p>
                  </div>
                </div>

                <Tabs defaultValue="curl" className="mt-6">
                  <TabsList>
                    <TabsTrigger value="curl">cURL</TabsTrigger>
                    <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                    <TabsTrigger value="python">Python</TabsTrigger>
                    <TabsTrigger value="response">Resposta</TabsTrigger>
                  </TabsList>

                  <TabsContent value="curl" className="mt-4">
                    <pre className="bg-background p-4 rounded-lg overflow-x-auto border">
                      <code className="text-sm text-foreground">
{`# Busca por marca
curl -X GET "https://gtinapi.com.br/api/v1/gtins/search?brand=nestle&offset=0" \\
  -H "Authorization: Bearer sua-api-key-aqui"

# Busca por nome do produto
curl -X GET "https://gtinapi.com.br/api/v1/gtins/search?product_name=chocolate" \\
  -H "Authorization: Bearer sua-api-key-aqui"

# Busca combinada
curl -X GET "https://gtinapi.com.br/api/v1/gtins/search?brand=nestle&product_name=chocolate" \\
  -H "Authorization: Bearer sua-api-key-aqui"`}
                      </code>
                    </pre>
                  </TabsContent>

                  <TabsContent value="javascript" className="mt-4">
                    <pre className="bg-background p-4 rounded-lg overflow-x-auto border">
                      <code className="text-sm text-foreground">
{`const params = new URLSearchParams({
  brand: 'nestle',
  product_name: 'chocolate',
  offset: 0
});

const response = await fetch(\`https://gtinapi.com.br/api/v1/gtins/search?\${params}\`, {
  headers: {
    'Authorization': 'Bearer sua-api-key-aqui'
  }
});

const searchResults = await response.json();
console.log(\`Encontrados: \${searchResults.total} produtos\`);
console.log(\`Retornados: \${searchResults.returned} produtos\`);
console.log(searchResults.items);`}
                      </code>
                    </pre>
                  </TabsContent>

                  <TabsContent value="python" className="mt-4">
                    <pre className="bg-background p-4 rounded-lg overflow-x-auto border">
                      <code className="text-sm text-foreground">
{`import requests

params = {
    'brand': 'nestle',
    'product_name': 'chocolate',
    'offset': 0
}

response = requests.get(
    'https://gtinapi.com.br/api/v1/gtins/search',
    params=params,
    headers={'Authorization': 'Bearer sua-api-key-aqui'}
)

search_results = response.json()
print(f"Encontrados: {search_results['total']} produtos")
print(f"Retornados: {search_results['returned']} produtos")
for item in search_results['items']:
    print(f"- {item['product_name']} ({item['gtin']})")`}
                      </code>
                    </pre>
                  </TabsContent>

                  <TabsContent value="response" className="mt-4">
                    <pre className="bg-background p-4 rounded-lg overflow-x-auto border">
                      <code className="text-sm text-foreground">
{`{
  "total": 245,
  "offset": 0,
  "limit": 10,
  "returned": 10,
  "items": [
    {
      "gtin": "7891234567890",
      "gtin_type": "GTIN-13",
      "brand": "NESTLE",
      "product_name": "Chocolate NESTLE Classic 90g",
      "owner_tax_id": "60.409.075/0001-52",
      "origin_country": "Brasil",
      "ncm": "18063210",
      "cest": "1700900",
      "gross_weight_value": 95.0,
      "gross_weight_unit": "g"
    },
    {
      "gtin": "7891234567891",
      "gtin_type": "GTIN-13",
      "brand": "NESTLE",
      "product_name": "Chocolate NESTLE Branco 90g",
      "ncm": "18063210"
    }
    // ... mais 8 produtos
  ]
}`}
                      </code>
                    </pre>
                  </TabsContent>
                </Tabs>

                <div className="mt-6">
                  <h4 className="font-semibold text-foreground mb-3">Paginação</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Use o campo <code className="bg-muted px-2 py-0.5 rounded">offset</code> para navegar pelos resultados:
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li>• <code className="bg-muted px-2 py-0.5 rounded">offset=0</code> → primeiros 10 produtos</li>
                    <li>• <code className="bg-muted px-2 py-0.5 rounded">offset=10</code> → produtos 11-20</li>
                    <li>• <code className="bg-muted px-2 py-0.5 rounded">offset=20</code> → produtos 21-30</li>
                  </ul>
                </div>
              </Card>
            </div>
          </section>

          {/* Error Handling */}
          <section id="erros">
            <h2 className="text-3xl font-bold text-foreground mb-4 border-b pb-2">6. Tratamento de Erros</h2>
            <p className="text-foreground leading-relaxed mb-6">
              A API usa códigos de status HTTP padrão. Todos os erros retornam um objeto JSON com detalhes sobre o problema.
            </p>

            <div className="space-y-6">
              <Card className="p-6 bg-red-500/5 border-red-500/20">
                <h3 className="font-bold text-lg mb-3">Erro 400 - Bad Request</h3>
                <pre className="bg-background p-4 rounded-lg overflow-x-auto text-sm border">
                  <code className="text-foreground">
{`{
  "detail": "GTIN inválido: deve conter apenas números"
}`}
                  </code>
                </pre>
                <p className="text-sm text-muted-foreground mt-3">
                  <strong>Causas comuns:</strong> GTIN com formato inválido, parâmetros ausentes na busca, mais de 10 GTINs no batch GET
                </p>
              </Card>

              <Card className="p-6 bg-red-500/5 border-red-500/20">
                <h3 className="font-bold text-lg mb-3">Erro 401 - Unauthorized</h3>
                <pre className="bg-background p-4 rounded-lg overflow-x-auto text-sm border">
                  <code className="text-foreground">
{`{
  "detail": "Invalid API key"
}`}
                  </code>
                </pre>
                <p className="text-sm text-muted-foreground mt-3">
                  <strong>Causas comuns:</strong> API key não fornecida, API key inválida, API key desativada
                </p>
              </Card>

              <Card className="p-6 bg-orange-500/5 border-orange-500/20">
                <h3 className="font-bold text-lg mb-3">Erro 403 - Forbidden</h3>
                <pre className="bg-background p-4 rounded-lg overflow-x-auto text-sm border">
                  <code className="text-foreground">
{`{
  "detail": "Seu plano não permite consultas de API. Faça upgrade para Starter ou superior."
}

// ou

{
  "detail": "Seu plano não permite consultas em batch. Atualize seu plano para habilitar."
}

// ou

{
  "detail": "Limite do plano excedido: máximo de 2 GTINs por batch."
}`}
                  </code>
                </pre>
                <p className="text-sm text-muted-foreground mt-3">
                  <strong>Causas comuns:</strong> Plano Basic tentando acessar API, excedeu limite de GTINs por batch do seu plano
                </p>
              </Card>

              <Card className="p-6 bg-orange-500/5 border-orange-500/20">
                <h3 className="font-bold text-lg mb-3">Erro 404 - Not Found</h3>
                <pre className="bg-background p-4 rounded-lg overflow-x-auto text-sm border">
                  <code className="text-foreground">
{`{
  "detail": "Produto com GTIN '7891234567890' não encontrado"
}`}
                  </code>
                </pre>
                <p className="text-sm text-muted-foreground mt-3">
                  <strong>Causas comuns:</strong> GTIN não existe na nossa base de dados (isso não é um erro de API, apenas indica que o produto não foi encontrado)
                </p>
              </Card>

              <Card className="p-6 bg-purple-500/5 border-purple-500/20">
                <h3 className="font-bold text-lg mb-3">Erro 429 - Too Many Requests</h3>
                <pre className="bg-background p-4 rounded-lg overflow-x-auto text-sm border">
                  <code className="text-foreground">
{`// Rate limit de requisições/minuto excedido
{
  "detail": "Limite de 60 requisições/minuto excedido para seu plano (starter). Aguarde 15s."
}

// Limite mensal excedido
{
  "detail": "Limite mensal excedido. Restam 0 de 1000 chamadas para este mês."
}

// Cooldown de search
{
  "detail": "Aguarde 4s entre pesquisas. Seu plano (pro) permite 1 pesquisa a cada 4s."
}`}
                  </code>
                </pre>
                <p className="text-sm text-muted-foreground mt-3">
                  <strong>Headers úteis:</strong>
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 mt-2">
                  <li>• <code className="bg-background px-2 py-0.5 rounded">Retry-After</code> - Segundos até poder tentar novamente</li>
                  <li>• <code className="bg-background px-2 py-0.5 rounded">X-RateLimit-Limit</code> - Seu limite total</li>
                  <li>• <code className="bg-background px-2 py-0.5 rounded">X-RateLimit-Remaining</code> - Requisições restantes</li>
                </ul>
              </Card>

              <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h4 className="font-semibold text-foreground mb-3">💡 Dica: Tratamento Robusto de Erros</h4>
                <pre className="bg-background p-4 rounded-lg overflow-x-auto text-sm border mt-3">
                  <code className="text-foreground">
{`// JavaScript/TypeScript
async function consultarGTIN(gtin) {
  try {
    const response = await fetch(\`https://gtinapi.com.br/api/v1/gtins/\${gtin}\`, {
      headers: { 'Authorization': 'Bearer sua-api-key' }
    });
    
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      console.log(\`Rate limit! Aguarde \${retryAfter}s\`);
      return null;
    }
    
    if (response.status === 404) {
      console.log('Produto não encontrado');
      return null;
    }
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao consultar API:', error);
    throw error;
  }
}`}
                  </code>
                </pre>
              </div>
            </div>
          </section>

          {/* Plans Section */}
          <section id="planos">
            <h2 className="text-3xl font-bold text-foreground mb-4 border-b pb-2">7. Planos e Limites</h2>
            <p className="text-foreground leading-relaxed mb-6">
              Escolha o plano que melhor se adapta às suas necessidades. Todos os planos incluem acesso total aos dados 
              de produtos brasileiros com informações do CNP.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Basic Plan */}
              <Card className="p-6 border-2">
                <div className="mb-4">
                  <Badge variant="outline" className="bg-gray-100 mb-2">Basic</Badge>
                  <div className="text-3xl font-bold text-foreground">Grátis</div>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">✗</span>
                    <span className="text-muted-foreground">Sem acesso à API</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span>Consulta manual no site</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span>Até 5 consultas/dia</span>
                  </li>
                </ul>
                <div className="mt-6">
                  <Link href="/pricing" className="text-primary hover:underline text-sm font-medium">
                    Plano atual →
                  </Link>
                </div>
              </Card>

              {/* Starter Plan */}
              <Card className="p-6 border-2 border-blue-500">
                <div className="mb-4">
                  <Badge className="bg-blue-100 text-blue-700 mb-2">Starter</Badge>
                  <div className="text-3xl font-bold text-foreground">R$ 49</div>
                  <div className="text-sm text-muted-foreground">/mês</div>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span><strong>60 req/min</strong> lookup</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span><strong>1.000</strong> chamadas/mês</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span>Batch: até 2 GTINs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span>Search: 6s cooldown</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span>Suporte por email</span>
                  </li>
                </ul>
                <div className="mt-6">
                  <Link href="/pricing" className="text-primary hover:underline text-sm font-medium">
                    Fazer upgrade →
                  </Link>
                </div>
              </Card>

              {/* Pro Plan */}
              <Card className="p-6 border-2 border-purple-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs px-3 py-1 rounded-bl-lg font-semibold">
                  Popular
                </div>
                <div className="mb-4">
                  <Badge className="bg-purple-100 text-purple-700 mb-2">Pro</Badge>
                  <div className="text-3xl font-bold text-foreground">R$ 149</div>
                  <div className="text-sm text-muted-foreground">/mês</div>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span><strong>90 req/min</strong> lookup</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span><strong>10.000</strong> chamadas/mês</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span>Batch: até 5 GTINs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span>Search: 4s cooldown</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span>Suporte prioritário</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span>Webhooks</span>
                  </li>
                </ul>
                <div className="mt-6">
                  <Link href="/pricing" className="text-primary hover:underline text-sm font-medium">
                    Fazer upgrade →
                  </Link>
                </div>
              </Card>

              {/* Advanced Plan */}
              <Card className="p-6 border-2 border-amber-500">
                <div className="mb-4">
                  <Badge className="bg-amber-100 text-amber-700 mb-2">Advanced</Badge>
                  <div className="text-3xl font-bold text-foreground">R$ 399</div>
                  <div className="text-sm text-muted-foreground">/mês</div>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span><strong>120 req/min</strong> lookup</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span><strong>Ilimitado</strong> chamadas/mês</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span>Batch: até 10 GTINs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span>Search: 2s cooldown</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span>Suporte 24/7</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span>Webhooks + SLA</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span>IP dedicado</span>
                  </li>
                </ul>
                <div className="mt-6">
                  <Link href="/pricing" className="text-primary hover:underline text-sm font-medium">
                    Fazer upgrade →
                  </Link>
                </div>
              </Card>
            </div>

            <div className="p-6 bg-muted/30 rounded-lg border">
              <h4 className="font-semibold text-foreground mb-3">📊 Comparativo Completo</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Recurso</th>
                      <th className="text-center py-3 px-4">Basic</th>
                      <th className="text-center py-3 px-4">Starter</th>
                      <th className="text-center py-3 px-4">Pro</th>
                      <th className="text-center py-3 px-4">Advanced</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b">
                      <td className="py-3 px-4">Acesso à API</td>
                      <td className="text-center py-3 px-4">-</td>
                      <td className="text-center py-3 px-4">✓</td>
                      <td className="text-center py-3 px-4">✓</td>
                      <td className="text-center py-3 px-4">✓</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Req/min (lookup)</td>
                      <td className="text-center py-3 px-4">-</td>
                      <td className="text-center py-3 px-4">60</td>
                      <td className="text-center py-3 px-4">90</td>
                      <td className="text-center py-3 px-4">120</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Limite mensal</td>
                      <td className="text-center py-3 px-4">-</td>
                      <td className="text-center py-3 px-4">1.000</td>
                      <td className="text-center py-3 px-4">10.000</td>
                      <td className="text-center py-3 px-4">∞</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Batch (GTINs/req)</td>
                      <td className="text-center py-3 px-4">-</td>
                      <td className="text-center py-3 px-4">2</td>
                      <td className="text-center py-3 px-4">5</td>
                      <td className="text-center py-3 px-4">10</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Search cooldown</td>
                      <td className="text-center py-3 px-4">-</td>
                      <td className="text-center py-3 px-4">6s</td>
                      <td className="text-center py-3 px-4">4s</td>
                      <td className="text-center py-3 px-4">2s</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Suporte</td>
                      <td className="text-center py-3 px-4">-</td>
                      <td className="text-center py-3 px-4">Email</td>
                      <td className="text-center py-3 px-4">Prioritário</td>
                      <td className="text-center py-3 px-4">24/7</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">SLA</td>
                      <td className="text-center py-3 px-4">-</td>
                      <td className="text-center py-3 px-4">-</td>
                      <td className="text-center py-3 px-4">-</td>
                      <td className="text-center py-3 px-4">99.9%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Best Practices */}
          <section id="boas-praticas">
            <h2 className="text-3xl font-bold text-foreground mb-4 border-b pb-2">8. Melhores Práticas</h2>
            
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                  <span>🚀</span> Performance e Otimização
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <div>
                      <strong className="text-foreground">Use batch requests sempre que possível</strong>
                      <p className="text-muted-foreground mt-1">
                        Uma requisição batch com 5 GTINs é mais eficiente que 5 requisições individuais, além de contar 
                        como apenas 1 chamada no seu limite mensal.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <div>
                      <strong className="text-foreground">Implemente cache local</strong>
                      <p className="text-muted-foreground mt-1">
                        Produtos raramente mudam. Cache respostas bem-sucedidas por pelo menos 24 horas para reduzir 
                        chamadas desnecessárias.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <div>
                      <strong className="text-foreground">Use GET /batch para resultados cacheáveis</strong>
                      <p className="text-muted-foreground mt-1">
                        Se você consulta os mesmos GTINs frequentemente, use GET em vez de POST para aproveitar o 
                        cache HTTP (Cache-Control: max-age=3600).
                      </p>
                    </div>
                  </li>
                </ul>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                  <span>⚡</span> Tratamento de Rate Limits
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <div>
                      <strong className="text-foreground">Implemente retry com backoff exponencial</strong>
                      <p className="text-muted-foreground mt-1">
                        Quando receber 429, aguarde o tempo indicado no header <code className="bg-muted px-2 py-0.5 rounded">Retry-After</code> 
                        antes de tentar novamente.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <div>
                      <strong className="text-foreground">Monitore headers de rate limit</strong>
                      <p className="text-muted-foreground mt-1">
                        Verifique <code className="bg-muted px-2 py-0.5 rounded">X-RateLimit-Remaining</code> para saber 
                        quantas requisições restam antes de implementar delays preventivos.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <div>
                      <strong className="text-foreground">Distribua requisições ao longo do tempo</strong>
                      <p className="text-muted-foreground mt-1">
                        Evite "bursts" de centenas de requisições de uma vez. Use filas e processamento assíncrono.
                      </p>
                    </div>
                  </li>
                </ul>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                  <span>🔒</span> Segurança
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <div>
                      <strong className="text-foreground">Nunca exponha sua API key no código cliente</strong>
                      <p className="text-muted-foreground mt-1">
                        API keys devem ser usadas apenas no backend. Use variáveis de ambiente (<code className="bg-muted px-2 py-0.5 rounded">.env</code>).
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <div>
                      <strong className="text-foreground">Use HTTPS sempre</strong>
                      <p className="text-muted-foreground mt-1">
                        Nossa API só aceita conexões HTTPS. Nunca transmita sua API key por HTTP.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <div>
                      <strong className="text-foreground">Rotacione API keys periodicamente</strong>
                      <p className="text-muted-foreground mt-1">
                        Por segurança, crie novas API keys a cada 90 dias e desative as antigas.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <div>
                      <strong className="text-foreground">Monitore uso anormal</strong>
                      <p className="text-muted-foreground mt-1">
                        Use o dashboard para verificar padrões de uso. Picos inesperados podem indicar vazamento de credenciais.
                      </p>
                    </div>
                  </li>
                </ul>
              </Card>

              <Card className="p-6 bg-blue-500/5 border-blue-500/20">
                <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                  <span>💡</span> Exemplo: Implementação Ideal
                </h3>
                <pre className="bg-background p-4 rounded-lg overflow-x-auto text-sm border">
                  <code className="text-foreground">
{`// Node.js + TypeScript - Implementação com cache e retry
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
const CACHE_TTL = 86400; // 24 horas
const API_KEY = process.env.GTIN_API_KEY;

async function consultarGTINComCache(gtin: string) {
  // 1. Tentar cache primeiro
  const cached = await redis.get(\`gtin:\${gtin}\`);
  if (cached) {
    return JSON.parse(cached);
  }

  // 2. Consultar API com retry
  let retries = 0;
  while (retries < 3) {
    try {
      const response = await fetch(
        \`https://gtinapi.com.br/api/v1/gtins/\${gtin}\`,
        { headers: { 'Authorization': \`Bearer \${API_KEY}\` } }
      );

      if (response.status === 429) {
        const retryAfter = Number(response.headers.get('Retry-After')) || 5;
        await sleep(retryAfter * 1000);
        retries++;
        continue;
      }

      if (response.status === 404) {
        // Cachear "não encontrado" por menos tempo
        await redis.setex(\`gtin:\${gtin}\`, 3600, JSON.stringify(null));
        return null;
      }

      if (!response.ok) {
        throw new Error(\`API error: \${response.status}\`);
      }

      const data = await response.json();
      
      // 3. Cachear resultado
      await redis.setex(\`gtin:\${gtin}\`, CACHE_TTL, JSON.stringify(data));
      
      return data;
    } catch (error) {
      retries++;
      if (retries >= 3) throw error;
      await sleep(1000 * retries); // Backoff exponencial
    }
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));`}
                  </code>
                </pre>
              </Card>
            </div>
          </section>
          {/* Support Section */}
          <section className="bg-gradient-to-r from-primary/10 to-primary/5 p-8 rounded-lg border">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-foreground mb-3">Precisa de Ajuda?</h2>
              <p className="text-muted-foreground mb-6">
                Nossa equipe está pronta para ajudar você a integrar a API GTIN no seu projeto.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link 
                  href="mailto:suporte@gtinapi.com.br" 
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Contatar Suporte
                </Link>
                <Link 
                  href="/dashboard" 
                  className="px-6 py-2 bg-background text-foreground border border-border rounded-lg hover:bg-muted/50 transition-colors font-medium"
                >
                  Acessar Dashboard
                </Link>
              </div>
            </div>
          </section>

          {/* Quick Reference */}
          <section className="mt-8">
            <Card className="p-6">
              <h3 className="font-bold text-xl mb-4">📚 Referência Rápida</h3>
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Base URL</h4>
                  <code className="bg-muted px-3 py-1 rounded block">https://gtinapi.com.br/api</code>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Autenticação</h4>
                  <code className="bg-muted px-3 py-1 rounded block">Authorization: Bearer {"{key}"}</code>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Formato de Resposta</h4>
                  <code className="bg-muted px-3 py-1 rounded block">application/json</code>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Versão da API</h4>
                  <code className="bg-muted px-3 py-1 rounded block">v1</code>
                </div>
              </div>
            </Card>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-foreground mb-3">GTIN API</h3>
              <p className="text-sm text-muted-foreground">
                API completa de consulta de produtos por GTIN com dados brasileiros oficiais do CNP.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Links Úteis</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/dashboard" className="text-muted-foreground hover:text-primary">Dashboard</Link></li>
                <li><Link href="/pricing" className="text-muted-foreground hover:text-primary">Planos e Preços</Link></li>
                <li><a href="#introducao" className="text-muted-foreground hover:text-primary">Documentação</a></li>
                <li><Link href="/status" className="text-muted-foreground hover:text-primary">Status da API</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Suporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Email: suporte@gtinapi.com.br</li>
                <li>Horário: Seg-Sex, 9h-18h</li>
                <li>Response time: até 24h</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-6 text-center text-sm text-muted-foreground">
            <p>© 2026 GTIN API. Todos os direitos reservados.</p>
            <p className="mt-2">
              Dados oficiais do Cadastro Nacional de Produtos (CNP) • Atualizado em {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
