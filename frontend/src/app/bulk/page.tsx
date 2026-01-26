"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Database,
  FileDown,
  FileSpreadsheet,
  Mail,
  MessageCircle,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LandingNavbar } from "@/components/landing-page/LandingNavbar";
import { FadeIn } from "@/components/landing-page/components/ui/fade-in";

const productFields = [
  { label: "GTIN", desc: "Código normalizado" },
  { label: "Tipo (8/12/13/14)", desc: "GTIN type" },
  { label: "Marca", desc: "brand" },
  { label: "Descrição", desc: "product_name" },
  { label: "País de origem", desc: "origin_country" },
  { label: "NCM", desc: "ncm + ncm_formatted" },
  { label: "CEST", desc: "cest (array)" },
  { label: "Peso bruto", desc: "gross_weight_value + unit" },
  { label: "DSIT", desc: "dsit_date" },
  { label: "Atualização", desc: "updated_at" },
  { label: "Imagem", desc: "image_url" },
];

const steps = [
  { title: "Envie sua lista", desc: "Envie, por e-mail, sua planilha CSV com a coluna gtin.", icon: UploadCloud },
  { title: "Validamos e normalizamos", desc: "GTINs higienizados antes de processar.", icon: ShieldCheck },
  { title: "Enriquecemos os dados", desc: "NCM, CEST, marca, peso, datas, URL da imagem.", icon: Database },
  { title: "Entrega combinada", desc: "Você recebe o CSV formatado, após a confirmação do pagamento.", icon: FileSpreadsheet },
];

const tiers = [
  { name: "Starter", price: "R$ 0,40", range: "1–999 GTINs", note: "Preço por GTIN" },
  { name: "Pro", price: "R$ 0,35", range: "1.000–9.999 GTINs", note: "Preço por GTIN" },
  { name: "Advanced", price: "R$ 0,30", range: "10.000–99.999 GTINs", note: "Preço por GTIN" },
  { name: "Enterprise", price: "R$ 0,25", range: "100.000+ GTINs", note: "Preço por GTIN" },
];

const mailtoHref = "mailto:contato@pesquisagtin.com.br?subject=Consulta%20Bulk%20GTIN&body=Oi!%20Quero%20consultar%20GTINs%20em%20lote.";
const whatsappHref = "https://wa.me/5500000000000?text=Quero%20consultar%20GTINs%20em%20lote"; // ajuste o número se desejar

export default function BulkPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNavbar variant="simple" />

      <main className="pt-24 md:pt-28">
        <section className="px-6 py-14 md:py-20 bg-primary/5 border-b border-border/50">
          <div className="max-w-5xl mx-auto text-center space-y-6">
           
            <FadeIn delay={0.1}>
              <h1 className="text-4xl md:text-5xl font-semibold text-primary">
                Consulta GTIN em Lote, com dados prontos para o seu ERP
              </h1>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Envie sua lista de GTINs e receba NCM, CEST, marca, descrição, peso, origem e datas padronizadas.
                
              </p>
            </FadeIn>
            <FadeIn delay={0.3}>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild className="rounded-full px-6">
                  <a href="#contato">
                    Solicitar Bulk
                  </a>
                </Button>
                <Button asChild variant="outline" className="rounded-full px-6">
                  <Link href="/bulk-exemplo.csv">
                    Ver exemplo de arquivo
                  </Link>
                </Button>
              </div>
            </FadeIn>
            <FadeIn delay={0.4}>
              <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                <BadgeCheck className="w-4 h-4 text-primary" />
                <span>Padronização: GTIN, NCM, CEST, marca, peso, datas</span>
              </div>
            </FadeIn>
          </div>
        </section>

        <section className="px-6 py-16 md:py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10 space-y-3">
              <h2 className="text-3xl font-semibold text-primary">Campos que entregamos</h2>
             
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {productFields.map((field, index) => (
                <FadeIn key={field.label} delay={index * 0.02}>
                  <Card className="h-full border-border/60">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-primary">{field.label}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription>{field.desc}</CardDescription>
                    </CardContent>
                  </Card>
                </FadeIn>
              ))}
            </div>

            <div className="mt-4 text-xs text-muted-foreground text-center">
              Observação: campos podem retornar vazios dependendo da disponibilidade na base.
            </div>
          </div>
        </section>

        <section className="px-6 py-16 md:py-20 bg-accent/30 border-y border-border/50">
          <div className="max-w-5xl mx-auto text-center space-y-4 mb-12">
            <h2 className="text-3xl font-semibold text-primary">Como funciona</h2>
            <p className="text-muted-foreground">
              Processo enxuto em quatro passos. Nesta fase, o envio e a entrega são combinados por contato direto.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {steps.map((step, index) => (
              <FadeIn key={step.title} delay={index * 0.05}>
                <Card className="h-full border-border/60">
                  <CardHeader className="space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <step.icon className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-lg text-primary">{step.title}</CardTitle>
                    <CardDescription className="text-muted-foreground">{step.desc}</CardDescription>
                  </CardHeader>
                </Card>
              </FadeIn>
            ))}
          </div>

          <div className="max-w-6xl mx-auto mt-10 p-4 rounded-xl bg-white/70 border border-border/60 text-sm text-muted-foreground">
          A maioria das pesquisas em lote é concluída em 24 a 48 horas, dependendo do tamanho da pesquisa e da quantidade de outros pedidos na fila.
          </div>
          <div className="max-w-6xl mx-auto mt-2 p-4 rounded-xl bg-white/70 border border-border/60 text-sm text-muted-foreground">
          Uma entrada de pesquisa é considerada bem-sucedida se algum dado for retornado para esse item.
          </div>
          <div className="max-w-6xl mx-auto mt-2 p-4 rounded-xl bg-white/70 border border-border/60 text-sm text-muted-foreground">
          As imagens dos produtos são fornecidas como links (URLs) para as fontes online onde a imagem está localizada, que são fornecidas pelos donos da marca. Não armazenamos nenhuma imagem.
          </div>


        </section>

        <section id="pricing" className="px-6 py-16 md:py-20">
          <div className="max-w-5xl mx-auto text-center space-y-3 mb-10">
            <h2 className="text-3xl font-semibold text-primary">Preços por faixa de GTIN</h2>
            <p className="text-muted-foreground">
              Cobramos por GTIN processado dentro da faixa. Prazo e forma de entrega combinados no contato.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {tiers.map((tier, index) => (
              <FadeIn key={tier.name} delay={index * 0.05}>
                <Card className="h-full border-border/70 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl text-primary">{tier.name}</CardTitle>
                    <CardDescription>{tier.range}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-3xl font-bold text-primary leading-tight">
                      {tier.price}
                      <span className="text-sm font-normal text-muted-foreground"> / GTIN</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{tier.note}</p>
                    <Button asChild variant="outline" className="w-full rounded-full">
                      <a href="#contato">
                        Falar sobre {tier.name}
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>

          <div className="max-w-4xl mx-auto mt-6 text-center text-sm text-muted-foreground">
            Só cobramos pelos GTINs da faixa selecionada. Para volumes muito grandes, podemos combinar condições adicionais.
          </div>
        </section>

        <section className="px-6 py-16 md:py-20 bg-primary text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
          <div className="max-w-5xl mx-auto relative z-10 text-center space-y-4">
            <h2 className="text-3xl font-semibold">Veja o arquivo de exemplo</h2>
            <p className="text-white/80 max-w-3xl mx-auto">
              Use este CSV como referência: uma coluna chamada <code className="bg-white/10 px-2 py-1 rounded">gtin</code> com os códigos a consultar.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
              <Button asChild variant="secondary" className="rounded-full px-6">
                <Link href="/bulk-exemplo.csv">
                  <FileDown className="w-4 h-4 mr-2" />
                  Baixar CSV de exemplo
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full px-6 text-white border-white/40 hover:bg-white/10">
                <Link href="/">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Voltar para a landing
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="contato" className="px-6 py-16 md:py-20 bg-accent/20">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <h2 className="text-3xl font-semibold text-primary">Fale com a gente</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Combine o envio da planilha e o prazo de retorno. Nesta fase, a entrega é manual (por e-mail ou canal direto).
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
              <Button asChild className="rounded-full px-6">
                <a href={mailtoHref}>
                  <Mail className="w-4 h-4 mr-2" />
                  Enviar e-mail
                </a>
              </Button>
              <Button asChild variant="outline" className="rounded-full px-6">
                <a href={whatsappHref} target="_blank" rel="noreferrer">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Falar no WhatsApp
                </a>
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              LGPD: tratamos apenas dados cadastrais de produtos para fins de consulta fiscal/comercial.
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
