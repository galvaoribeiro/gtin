"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowDown,
  Building2,
  CheckCircle2,
  Hammer,
  Handshake,
  Pill,
  RefreshCw,
  ScanLine,
  ShoppingBag,
  ShoppingCart,
  Store,
  Truck,
  Upload,
  Warehouse,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  { icon: Building2, title: "ERP", description: "Automatize cadastro e enriquecimento de produtos." },
  { icon: Store, title: "PDV", description: "Preencha dados no momento da venda ou cadastro." },
  { icon: ShoppingBag, title: "Supermercados", description: "Mantenha catálogos amplos atualizados." },
  { icon: Truck, title: "Distribuidores", description: "Processe listas de produtos de fornecedores." },
  { icon: Warehouse, title: "Atacarejos", description: "Enriqueça milhares de SKUs rapidamente." },
  { icon: Wrench, title: "Autopeças", description: "Recupere dados fiscais a partir do GTIN." },
  { icon: Pill, title: "Farmácias", description: "Cadastre produtos com dados padronizados." },
  { icon: Hammer, title: "Material de construção", description: "Complete cadastros de itens diversos." },
  { icon: ShoppingCart, title: "Varejo", description: "Reduza digitação e erros no cadastro." },
  { icon: ShoppingBag, title: "E-commerce", description: "Alimente catálogos online via integração." },
];

const partnershipSteps = [
  "Você integra a API",
  "Seus clientes utilizam a funcionalidade",
  "As consultas são processadas pelo Pesquisa GTIN",
  "Sua plataforma escala conforme a necessidade",
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

const integrationItems = [
  "REST API",
  "JSON",
  "API Key / Bearer",
  "Consultas individuais",
  "Consultas em lote",
  "Documentação OpenAPI",
];

const mailtoSales = `mailto:${CONTACT_EMAIL}?subject=Especialista%20Pesquisa%20GTIN%20-%20ERP`;
const mailtoPartnership = `mailto:${CONTACT_EMAIL}?subject=Parceria%20Pesquisa%20GTIN%20-%20ERP`;

export default function ErpPageClient() {
  useEffect(() => {
    track("erp_page_view");
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNavbar variant="simple" />

      <main className="pt-24 md:pt-28">
        <section className="px-6 py-16 md:py-24 bg-primary/5 border-b border-border/50">
          <div className="max-w-5xl mx-auto space-y-6">
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
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-4xl">
                Conecte seu sistema a uma API de dados de produtos por GTIN e preencha ou enriqueça seus cadastros
                sem precisar construir e manter toda essa base internamente.
              </p>
            </FadeIn>
            <FadeIn delay={0.3}>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="rounded-full px-8">
                  <Link href="/register" onClick={() => track("api_test_click", { source: "erp_hero" })}>
                    Testar a API gratuitamente
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full px-8">
                  <a href={mailtoSales} onClick={() => track("contact_sales_click", { source: "erp_hero" })}>
                    Falar com especialista
                  </a>
                </Button>
              </div>
            </FadeIn>
          </div>
        </section>

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
        </section>

        <section className="px-6 py-20 bg-accent/20 border-y border-border/50">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold text-primary mb-4">Seu ERP + Pesquisa GTIN</h2>
          </div>
          <div className="max-w-3xl mx-auto flex flex-col items-center gap-3">
            {["ERP", "GTIN", "Pesquisa GTIN API", "Dados estruturados", "Cadastro do produto"].map((step, index) => (
              <FadeIn key={step} delay={index * 0.05} className="w-full max-w-md">
                <div className="rounded-xl border border-border/60 bg-white px-6 py-4 text-center font-medium text-primary shadow-sm">
                  {step}
                </div>
                {index < 4 && <ArrowDown className="w-5 h-5 text-primary/30 my-1" />}
              </FadeIn>
            ))}
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-semibold text-primary">Você não precisa construir tudo do zero.</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Manter uma base própria de produtos exige coleta, tratamento, atualização, infraestrutura e desenvolvimento.
              O Pesquisa GTIN fornece uma camada de dados que seu sistema pode consultar por API.
            </p>
          </div>
        </section>

        <section className="px-6 py-20 bg-primary/5">
          <div className="max-w-6xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold text-primary mb-4">Ideal para</h2>
          </div>
          <div className="max-w-7xl mx-auto grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {idealFor.map((item, index) => (
              <FadeIn key={item.title} delay={index * 0.02}>
                <Card className="h-full border-border/60 text-center">
                  <CardHeader className="items-center">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-base text-primary">{item.title}</CardTitle>
                    <CardDescription className="text-xs leading-relaxed">{item.description}</CardDescription>
                  </CardHeader>
                </Card>
              </FadeIn>
            ))}
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-semibold text-primary mb-8">Integração</h2>
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {integrationItems.map((item) => (
                <Badge key={item} variant="outline" className="px-4 py-2 text-sm">
                  {item}
                </Badge>
              ))}
            </div>
            <Button asChild variant="outline" className="rounded-full px-8">
              <Link href={DOCS_PAGE_PATH} onClick={() => track("docs_click", { source: "erp_integration" })}>
                Ver documentação da API
              </Link>
            </Button>
          </div>
        </section>

        <section className="px-6 py-20 bg-[#0B1120] text-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-semibold mb-6">
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
            <p className="text-sm text-white/50 mt-8">
              Se você desenvolve um ERP, fale conosco.
            </p>
          </div>
        </section>

        <section className="px-6 py-20 bg-accent/20">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <Handshake className="w-10 h-10 text-primary mx-auto" />
            <h2 className="text-3xl font-semibold text-primary">
              Quer oferecer a consulta de produtos como recurso do seu ERP?
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Estamos desenvolvendo parcerias com software houses e plataformas que desejam incorporar dados de
              produtos aos seus sistemas.
            </p>
            <Button asChild className="rounded-full px-8">
              <a href={mailtoPartnership} onClick={() => track("partnership_click", { source: "erp_partnership" })}>
                Quero conversar sobre parceria
              </a>
            </Button>
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-semibold text-primary text-center mb-10">Como funciona a parceria</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {partnershipSteps.map((step, index) => (
                <FadeIn key={step} delay={index * 0.05}>
                  <Card className="border-border/60">
                    <CardHeader>
                      <div className="text-sm font-semibold text-primary/60">Passo {index + 1}</div>
                      <CardTitle className="text-lg text-primary">{step}</CardTitle>
                    </CardHeader>
                  </Card>
                </FadeIn>
              ))}
            </div>
            <p className="text-sm text-muted-foreground text-center mt-8">
              Condições comerciais personalizadas conforme volume e modelo de integração.
            </p>
          </div>
        </section>

        <section className="px-6 py-16 bg-primary/5 text-center">
          <p className="text-lg text-muted-foreground">Software houses já utilizam o Pesquisa GTIN.</p>
        </section>

        <MarketingPricing
          title="Planos para ERPs e plataformas"
          description="Volume e batch conforme a necessidade de integração do seu sistema."
          showEnterpriseVolume
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
              <Button asChild variant="outline" className="rounded-full px-8 border-white/30 text-white hover:bg-white/10">
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
