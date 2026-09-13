"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Hammer,
  HardDrive,
  Pill,
  Plug,
  RefreshCw,
  ScanLine,
  ShoppingBag,
  ShoppingCart,
  Store,
  Truck,
  Upload,
  Warehouse,
  Wrench,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LandingNavbar } from "@/components/landing-page/LandingNavbar";
import { LandingFooter } from "@/components/landing-page/LandingFooter";
import { MarketingPricing } from "@/components/landing-page/MarketingPricing";
import { MarketingFaq } from "@/components/landing-page/MarketingFaq";
import { FadeIn } from "@/components/landing-page/components/ui/fade-in";
import { CONTACT_EMAIL, DOCS_PAGE_PATH, ERP_FAQ } from "@/lib/marketing/constants";
import { track } from "@/lib/analytics";

const scenarios = [
  {
    icon: Upload,
    title: "Importação em lote",
    description: "Envie milhares de GTINs e receba os dados estruturados para enriquecer seu catálogo.",
  },
  {
    icon: ScanLine,
    title: "Cadastro individual",
    description: "O usuário informa ou escaneia o GTIN e seu ERP preenche os dados automaticamente.",
  },
  {
    icon: RefreshCw,
    title: "Atualização/enriquecimento",
    description: "Use os dados para complementar cadastros existentes com NCM, CEST, marca e descrição.",
  },
];

const idealFor = [
  { icon: Store, title: "PDV" },
  { icon: ShoppingBag, title: "Supermercados" },
  { icon: Truck, title: "Distribuidores" },
  { icon: Warehouse, title: "Atacarejos" },
  { icon: Wrench, title: "Autopeças" },
  { icon: Pill, title: "Farmácias" },
  { icon: Hammer, title: "Material de construção" },
  { icon: ShoppingCart, title: "Varejo" },
  { icon: ShoppingBag, title: "E-commerce" },
];

const comparisonRows = [
  {
    without: "Construir e manter um processo próprio de coleta e tratamento de dados",
    with: "Consulta via API REST, com dados já estruturados",
  },
  {
    without: "Cadastrar produtos manualmente, um por um",
    with: "Preenchimento automático do cadastro a partir do GTIN",
  },
  {
    without: "Lidar com inconsistências entre cadastros",
    with: "Campos padronizados, conforme disponibilidade na base",
  },
  {
    without: "Investir tempo de desenvolvimento em algo que não é o core do seu ERP",
    with: "Seu time foca no que diferencia o seu ERP",
  },
];

const softwareHouseBenefits = [
  "Menos digitação para os usuários do ERP",
  "Menos retrabalho no cadastro de produtos",
  "Cadastro mais rápido no dia a dia",
  "Enriquecimento de catálogo sob demanda",
  "Integração simples via REST + JSON",
  "Possibilidade de processar grandes volumes",
  "Experiência melhor para os clientes do ERP",
];

const registrationFields = [
  { label: "Descrição", value: "REFRIGERANTE COCA-COLA 350ML" },
  { label: "Marca", value: "COCA-COLA" },
  { label: "NCM", value: "22021000" },
  { label: "CEST", value: "03.007.00" },
  { label: "Peso bruto", value: "0.365 kg" },
];

const mailtoSales = `mailto:${CONTACT_EMAIL}?subject=Especialista%20Pesquisa%20GTIN%20-%20ERP`;

export default function ErpPageClient() {
  useEffect(() => {
    track("erp_page_view");
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNavbar variant="simple" />

      <main className="pt-24 md:pt-28">
        {/* Hero */}
        <section className="relative px-6 py-16 md:py-24 bg-primary/5 border-b border-border/50 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-24 w-80 h-80 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
            <div className="space-y-6">
              <FadeIn>
                <Badge variant="outline" className="rounded-full px-4 py-1.5 border-primary/20 bg-primary/5 text-primary">
                  Solução B2B para ERPs
                </Badge>
              </FadeIn>
              <FadeIn delay={0.1}>
                <h1 className="text-4xl md:text-5xl font-semibold text-primary leading-tight">
                  Automatize o cadastro de produtos do seu ERP
                </h1>
              </FadeIn>
              <FadeIn delay={0.2}>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
                  Conecte seu sistema a uma API de dados de produtos por GTIN e preencha ou enriqueça seus cadastros
                  sem precisar construir e manter toda essa base internamente.
                </p>
              </FadeIn>
              <FadeIn delay={0.3}>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild className="rounded-full px-8">
                    <Link href="/register" onClick={() => track("api_test_click", { source: "erp_hero" })}>
                      Testar com meu catálogo
                    </Link>
                  </Button>
                </div>
              </FadeIn>
            </div>

            <FadeIn delay={0.2}>
              <div className="bg-white rounded-2xl border border-border/60 shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-accent/30">
                  <span className="text-sm font-semibold text-primary">Cadastro de produto</span>
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Preenchido via GTIN</Badge>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 text-sm font-mono text-muted-foreground bg-accent/40 rounded-lg px-4 py-3">
                    <ScanLine className="w-4 h-4 text-primary shrink-0" />
                    7894900011517
                  </div>
                  <div className="space-y-3">
                    {registrationFields.map((field, index) => (
                      <FadeIn key={field.label} delay={0.3 + index * 0.08}>
                        <div className="flex items-center justify-between gap-4 text-sm border-b border-border/40 pb-3 last:border-0">
                          <span className="text-muted-foreground">{field.label}</span>
                          <div className="flex items-center gap-2 font-medium text-foreground text-right">
                            <span>{field.value}</span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          </div>
                        </div>
                      </FadeIn>
                    ))}
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Cenários */}
        <section className="px-6 py-20">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            {scenarios.map((item, index) => (
              <FadeIn key={item.title} delay={index * 0.05}>
                <Card className="h-full border-border/60">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-xl text-primary">{item.title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed">{item.description}</CardDescription>
                  </CardHeader>
                </Card>
              </FadeIn>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/api#como-funciona"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              onClick={() => track("docs_click", { source: "erp_scenarios_to_api" })}
            >
              Ver o fluxo técnico completo da integração
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Pare de manter base própria */}
        <section className="px-6 py-20 bg-accent/20 border-y border-border/50">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold text-primary">Você não precisa construir tudo do zero.</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Manter uma base própria de produtos exige coleta, tratamento, atualização, infraestrutura e desenvolvimento.
              O Pesquisa GTIN fornece uma camada de dados que seu sistema pode consultar por API.
            </p>
          </div>

          <FadeIn>
            <div className="max-w-5xl mx-auto relative rounded-3xl overflow-hidden border border-border/60 shadow-sm">
              <div className="grid md:grid-cols-2">
                <div className="bg-slate-100/80 p-8 md:p-10">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                      <HardDrive className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Sem a API</p>
                      <h3 className="text-xl font-semibold text-slate-600">Base própria e cadastro manual</h3>
                    </div>
                  </div>
                  <ul className="space-y-4">
                    {comparisonRows.map((row) => (
                      <li key={row.without} className="flex items-start gap-3 text-base text-slate-500 leading-relaxed">
                        <span className="mt-0.5 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0">
                          <X className="w-3.5 h-3.5 text-slate-400" />
                        </span>
                        {row.without}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="relative bg-[#0B1120] p-8 md:p-10 text-white">
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 rounded-full bg-emerald-400/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                        <Plug className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-emerald-400/80 font-medium">Com o Pesquisa GTIN</p>
                        <h3 className="text-xl font-semibold">Camada de dados pronta via API</h3>
                      </div>
                    </div>
                    <ul className="space-y-4">
                      {comparisonRows.map((row) => (
                        <li key={row.with} className="flex items-start gap-3 text-base text-white/85 leading-relaxed">
                          <span className="mt-0.5 w-6 h-6 rounded-full bg-emerald-400/15 border border-emerald-400/30 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          </span>
                          {row.with}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white border border-border shadow-md items-center justify-center">
                <ArrowRight className="w-5 h-5 text-primary" />
              </div>
            </div>
          </FadeIn>
        </section>

        {/* Ideal para */}
        <section className="px-6 py-20">
          <div className="max-w-4xl mx-auto text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-semibold text-primary mb-3">Ideal para</h2>
            <p className="text-muted-foreground">
              Qualquer sistema com um grande cadastro de produtos para manter.
            </p>
          </div>
          <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-3">
            {idealFor.map((item, index) => (
              <FadeIn key={item.title} delay={index * 0.02}>
                <div className="flex items-center gap-2 rounded-full border border-border/60 bg-white px-4 py-2 text-sm font-medium text-foreground shadow-sm">
                  <item.icon className="w-4 h-4 text-primary" />
                  {item.title}
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* Integração */}
        <section className="px-6 py-16 bg-primary/5 border-y border-border/50">
          <div className="max-w-3xl mx-auto text-center space-y-5">
            <h2 className="text-2xl md:text-3xl font-semibold text-primary">Integração simples</h2>
            <div className="flex flex-wrap justify-center gap-2">
              {["REST API", "JSON", "API Key / Bearer", "Consultas individuais", "Consultas em lote"].map((item) => (
                <Badge key={item} variant="outline" className="px-3 py-1.5 text-xs bg-white">
                  {item}
                </Badge>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
              <Button asChild variant="outline" className="rounded-full px-6">
                <Link href={DOCS_PAGE_PATH} onClick={() => track("docs_click", { source: "erp_integration" })}>
                  Ver documentação da API
                </Link>
              </Button>
              <Link
                href="/api#developers"
                className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1.5"
                onClick={() => track("docs_click", { source: "erp_integration_snippets" })}
              >
                Ver exemplos de código (cURL, JS, Python)
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Para software houses */}
        <section className="relative px-6 py-20 bg-[#0B1120] text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
          <div className="max-w-5xl mx-auto relative z-10">
            <h2 className="text-3xl md:text-4xl font-semibold mb-6 max-w-3xl">
              Transforme o cadastro de produtos em uma experiência melhor dentro do seu ERP.
            </h2>
            <ul className="grid sm:grid-cols-2 gap-4">
              {softwareHouseBenefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 text-white/80">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  {benefit}
                </li>
              ))}
            </ul>
            <p className="text-sm text-white/50 mt-8">Se você desenvolve um ERP, fale conosco.</p>
          </div>
        </section>

        <MarketingPricing
          title="Planos para ERPs e plataformas"
          description="Volume e batch conforme a necessidade de integração do seu sistema."
          showEnterprise={false}
        />

        <MarketingFaq title="Perguntas frequentes sobre ERP" items={ERP_FAQ} />

        <section className="px-6 py-16 bg-primary text-white">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-semibold">Dê ao seu ERP uma camada de dados de produtos</h2>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="rounded-full px-8 bg-white text-primary hover:bg-white/90">
                <Link href="/register" onClick={() => track("api_test_click", { source: "erp_footer" })}>
                  Testar a API gratuitamente
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full px-8 bg-transparent border-white/50 text-white hover:bg-white/10 hover:text-white">
                <a href={mailtoSales} onClick={() => track("contact_sales_click", { source: "erp_footer" })}>
                  Falar com especialista
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
