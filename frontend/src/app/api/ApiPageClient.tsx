"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Code2,
  Database,
  Layers,
  ScanLine,
  Server,
  ShoppingCart,
  Store,
  Truck,
  Workflow,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LandingNavbar } from "@/components/landing-page/LandingNavbar";
import { LandingFooter } from "@/components/landing-page/LandingFooter";
import { MarketingPricing } from "@/components/landing-page/MarketingPricing";
import { MarketingFaq } from "@/components/landing-page/MarketingFaq";
import { FadeIn } from "@/components/landing-page/components/ui/fade-in";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/landing-page/components/ui/tabs";
import {
  DOCS_PAGE_PATH,
  API_FAQ,
  CODE_SNIPPETS,
  EXAMPLE_PRODUCT_JSON,
  EXAMPLE_GTIN,
} from "@/lib/marketing/constants";
import { track } from "@/lib/analytics";

const systemCards = [
  {
    icon: Building2,
    title: "ERP",
    description: "Enriqueça cadastros e importações de produtos sem manter uma base própria.",
  },
  {
    icon: Store,
    title: "PDV",
    description: "Preencha descrição, marca e dados fiscais no momento do cadastro no caixa.",
  },
  {
    icon: Workflow,
    title: "Automação comercial",
    description: "Integre consultas GTIN aos fluxos de cadastro, conferência e sincronização.",
  },
  {
    icon: ShoppingCart,
    title: "E-commerce",
    description: "Alimente catálogos online com dados padronizados a partir do código de barras.",
  },
  {
    icon: Layers,
    title: "Marketplaces",
    description: "Valide e complete informações de produtos antes de publicar anúncios.",
  },
  {
    icon: Truck,
    title: "Distribuidores",
    description: "Processe grandes listas de GTINs para atualizar catálogos de clientes.",
  },
  {
    icon: Database,
    title: "Sistemas fiscais",
    description: "Recupere NCM e CEST a partir do GTIN, conforme disponibilidade na base.",
  },
  {
    icon: Server,
    title: "Aplicações próprias",
    description: "Use a API como camada de dados de produtos no seu software customizado.",
  },
];

const flowSteps = [
  { label: "Seu sistema", detail: "Envia o GTIN" },
  { label: "Pesquisa GTIN", detail: "Consulta a base" },
  { label: "JSON", detail: "Dados estruturados" },
  { label: "ERP / Sistema", detail: "Usa no cadastro" },
];

export default function ApiPageClient() {
  useEffect(() => {
    track("api_page_view");
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNavbar variant="simple" />

      <main className="pt-24 md:pt-28">
        <section className="px-6 py-16 md:py-24 bg-primary/5 border-b border-border/50">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <FadeIn>
                <Badge variant="outline" className="rounded-full px-4 py-1.5 border-primary/20 bg-primary/5 text-primary">
                  API REST · JSON
                </Badge>
              </FadeIn>
              <FadeIn delay={0.1}>
                <h1 className="text-4xl md:text-5xl font-semibold text-primary leading-tight">
                  API de dados de produtos para o seu sistema
                </h1>
              </FadeIn>
              <FadeIn delay={0.2}>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                  Consulte produtos pelo GTIN e receba dados estruturados para integrar ao seu ERP, PDV, e-commerce ou aplicação.
                </p>
              </FadeIn>
              <FadeIn delay={0.3}>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild className="rounded-full px-8">
                    <Link href="/register" onClick={() => track("api_test_click", { source: "hero" })}>
                      Testar a API gratuitamente
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full px-8">
                    <Link href={DOCS_PAGE_PATH} onClick={() => track("docs_click", { source: "hero" })}>
                      Ver documentação
                    </Link>
                  </Button>
                </div>
              </FadeIn>
            </div>

            <FadeIn delay={0.2}>
              <div className="bg-[#0D1117] rounded-xl border border-white/10 shadow-2xl overflow-hidden font-mono text-sm">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="text-xs text-white/40">GET /v1/gtins/{"{gtin}"}</div>
                </div>
                <div className="p-6 space-y-4 overflow-x-auto">
                  <pre className="text-emerald-400 text-sm leading-relaxed whitespace-pre-wrap">
{`GET /v1/gtins/${EXAMPLE_GTIN}
Authorization: Bearer sk_live_...`}
                  </pre>
                  <pre className="text-sky-300/90 text-sm leading-relaxed whitespace-pre-wrap">
                    {EXAMPLE_PRODUCT_JSON}
                  </pre>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="max-w-5xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold text-primary mb-4">Como funciona</h2>
            <p className="text-muted-foreground">Integração simples em quatro passos</p>
          </div>
          <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-6">
            {flowSteps.map((step, index) => (
              <FadeIn key={step.label} delay={index * 0.05}>
                <div className="relative">
                  <Card className="h-full text-center border-border/60">
                    <CardHeader>
                      <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 text-primary flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                      <CardTitle className="text-lg text-primary">{step.label}</CardTitle>
                      <CardDescription>{step.detail}</CardDescription>
                    </CardHeader>
                  </Card>
                  {index < flowSteps.length - 1 && (
                    <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/30" />
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button asChild className="rounded-full px-8">
              <Link href="/register" onClick={() => track("api_test_click", { source: "how_it_works" })}>
                Testar a API gratuitamente
              </Link>
            </Button>
          </div>
        </section>

        <section className="px-6 py-20 bg-accent/20 border-y border-border/50">
          <div className="max-w-6xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold text-primary mb-4">Feito para sistemas</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Infraestrutura de dados para quem desenvolve ou opera software comercial.
            </p>
          </div>
          <div className="max-w-7xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {systemCards.map((item, index) => (
              <FadeIn key={item.title} delay={index * 0.03}>
                <Card className="h-full border-border/60">
                  <CardHeader>
                    <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-lg text-primary">{item.title}</CardTitle>
                    <CardDescription className="leading-relaxed">{item.description}</CardDescription>
                  </CardHeader>
                </Card>
              </FadeIn>
            ))}
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-semibold text-primary mb-4">
                Enriqueça milhares de produtos sem construir e manter sua própria base
              </h2>
              <p className="text-muted-foreground max-w-3xl mx-auto">
                Dois caminhos conforme o volume e a forma de integração do seu sistema.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <FadeIn>
                <Card className="h-full border-primary/20">
                  <CardHeader>
                    <Badge className="w-fit">Self-service</Badge>
                    <CardTitle className="text-2xl text-primary">Lote via API</CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      Seu sistema envia listas de GTINs via POST /v1/gtins/batch e recebe os dados estruturados em JSON.
                      Ideal para importações automatizadas dentro do seu ERP.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-xl bg-[#0D1117] p-4 font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                      {CODE_SNIPPETS.batch}
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• Até 100 GTINs por requisição (limite absoluto)</li>
                      <li>• Starter: 5 · Pro: 10 · Advanced: 20 · Enterprise: 100 por requisição</li>
                      <li>• Seu sistema itera as chamadas para processar volumes maiores</li>
                    </ul>
                  </CardContent>
                </Card>
              </FadeIn>

              <FadeIn delay={0.1}>
                <Card className="h-full border-border/60">
                  <CardHeader>
                    <Badge variant="outline" className="w-fit">Processamento assistido</Badge>
                    <CardTitle className="text-2xl text-primary">Lote via serviço Bulk</CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      Para volumes muito grandes de uma só vez, envie sua lista por e-mail e receba um CSV enriquecido
                      em 24 a 48 horas — sem precisar orquestrar milhares de chamadas no seu sistema.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col items-center gap-3 py-6 text-sm text-muted-foreground">
                      <div className="px-4 py-2 rounded-lg bg-accent/50 border">Lista de GTINs (CSV)</div>
                      <ArrowRight className="w-4 h-4 text-primary/40" />
                      <div className="px-4 py-2 rounded-lg bg-primary/10 text-primary font-medium">Pesquisa GTIN</div>
                      <ArrowRight className="w-4 h-4 text-primary/40" />
                      <div className="px-4 py-2 rounded-lg bg-accent/50 border">Catálogo enriquecido (CSV)</div>
                    </div>
                    <Button asChild className="w-full rounded-full">
                      <Link href="/bulk" onClick={() => track("batch_request", { source: "bulk_service" })}>
                        Testar com seus próprios GTINs
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </FadeIn>
            </div>
          </div>
        </section>

        <section className="px-6 py-20 bg-primary text-white">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-semibold mb-4">Use durante o cadastro</h2>
              <p className="text-white/80 leading-relaxed mb-6">
                Preencha o cadastro do produto automaticamente a partir do GTIN.
              </p>
              <p className="text-white/70 text-sm leading-relaxed">
                O operador digita ou escaneia o código de barras. Seu sistema consulta a API e recebe descrição, marca,
                NCM, CEST, peso e demais campos disponíveis — conforme disponibilidade na base.
              </p>
            </div>
            <Card className="bg-white/10 border-white/10 text-white">
              <CardContent className="p-6 space-y-4 font-mono text-sm">
                <div className="flex items-center gap-3">
                  <ScanLine className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{EXAMPLE_GTIN}</span>
                </div>
                <div className="h-px bg-white/10" />
                <div className="space-y-2 text-white/80">
                  <p>product_name: REFRIGERANTE COCA-COLA 350ML</p>
                  <p>brand: COCA-COLA</p>
                  <p>ncm: 22021000</p>
                  <p>cest: [&quot;03.007.00&quot;]</p>
                  <p>gross_weight_value: 0.365</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="px-6 py-20 bg-[#0B1120] text-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <Code2 className="w-5 h-5 text-emerald-400" />
              <span className="text-sm uppercase tracking-wider text-white/60">Para desenvolvedores</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">Integre em minutos</h2>
            <p className="text-white/70 max-w-2xl mb-8">
              REST API · JSON · API Key / Bearer · Consultas individuais · Consultas em lote · Documentação OpenAPI
            </p>

            <Tabs defaultValue="curl" className="w-full">
              <TabsList className="bg-white/10">
                <TabsTrigger value="curl">cURL</TabsTrigger>
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
              </TabsList>
              <TabsContent value="curl">
                <pre className="mt-4 rounded-xl bg-[#0D1117] border border-white/10 p-6 overflow-x-auto text-sm text-emerald-400 whitespace-pre-wrap">
                  {CODE_SNIPPETS.curl}
                </pre>
              </TabsContent>
              <TabsContent value="javascript">
                <pre className="mt-4 rounded-xl bg-[#0D1117] border border-white/10 p-6 overflow-x-auto text-sm text-emerald-400 whitespace-pre-wrap">
                  {CODE_SNIPPETS.javascript}
                </pre>
              </TabsContent>
              <TabsContent value="python">
                <pre className="mt-4 rounded-xl bg-[#0D1117] border border-white/10 p-6 overflow-x-auto text-sm text-emerald-400 whitespace-pre-wrap">
                  {CODE_SNIPPETS.python}
                </pre>
              </TabsContent>
            </Tabs>

            <p className="text-sm text-white/50 mt-6">
              Também disponível: GET /v1/gtins/search para busca por marca, nome ou NCM.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Button asChild className="rounded-full px-8 bg-white text-primary hover:bg-white/90">
                <Link href="/register" onClick={() => track("signup_click", { source: "developers" })}>
                  Começar integração
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full px-8 border-white/20 text-white hover:bg-white/10">
                <Link href={DOCS_PAGE_PATH} onClick={() => track("docs_click", { source: "developers" })}>
                  Ver documentação
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="px-6 py-16 text-center">
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Desenvolvido para software houses e sistemas de gestão.
          </p>
        </section>

        <MarketingPricing />

        <MarketingFaq items={API_FAQ} />

        <section className="px-6 py-16 bg-primary/5 border-t border-border/50">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-semibold text-primary">Pronto para integrar?</h2>
            <p className="text-muted-foreground">
              Crie sua conta gratuita, gere sua API Key e faça sua primeira consulta em minutos.
            </p>
            <Button asChild size="lg" className="rounded-full px-10">
              <Link href="/register" onClick={() => track("api_test_click", { source: "footer_cta" })}>
                Testar a API gratuitamente
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
