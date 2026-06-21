"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/landing-page/components/ui/dialog";
import { 
  CheckCircle2, 
  Database, 
  Search, 
  Zap, 
  ShieldCheck, 
  Users,
  FileText,
  Loader2,
  AlertCircle,
  AlertTriangle
} from "lucide-react";

import { Typewriter } from "@/components/landing-page/components/ui/typewriter";
import { FadeIn } from "@/components/landing-page/components/ui/fade-in";
import { LandingNavbar } from "@/components/landing-page/LandingNavbar";

import { fetchGtinPublic, type Product, ApiError } from "@/lib/api";

const FAKE_COMPANY_NAMES = [
  "Atlas Contábil",
  "Loja Express",
  "Fiscal Pro",
  "Vetta Commerce",
];

export default function LandingPageClient() {
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [isRateLimitError, setIsRateLimitError] = useState(false);
  
  const [gtinInput, setGtinInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<Product | null>(null);

  useEffect(() => {
    if (!searchError) return;
    const timer = setTimeout(() => {
      setSearchError(null);
      setIsRateLimitError(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, [searchError]);
  
  const handleSearch = async (gtin?: string) => {
    const gtinToSearch = gtin || gtinInput;
    
    if (!gtinToSearch.trim()) {
      setSearchError("Digite um GTIN para consultar");
      return;
    }
    
    setIsSearching(true);
    setSearchError(null);
    setSearchResult(null);
    setIsResultOpen(false);
    setIsRateLimitError(false);
    
    try {
      const product = await fetchGtinPublic(gtinToSearch.trim());
      setSearchResult(product);
      setSearchError(null);
      setIsResultOpen(true);
    } catch (error) {
      if (error instanceof ApiError) {
        const friendly =
          error.status === 429
            ? error.detail ||
              "Você atingiu o limite diário para visitantes anônimos. Para continuar consultando gratuitamente, crie sua conta gratuita."
            : error.detail || error.message;
        setSearchError(friendly);
        setIsRateLimitError(error.status === 429);
      } else {
        setSearchError("Erro ao consultar GTIN. Tente novamente.");
        setIsRateLimitError(false);
      }
      setSearchResult(null);
      setIsResultOpen(false);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleExampleClick = (gtin: string) => {
    setGtinInput(gtin);
    handleSearch(gtin);
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-accent selection:text-primary">
      
      <LandingNavbar />

      {searchError && (
        <div
          className={`fixed right-4 top-24 z-50 max-w-sm rounded-xl border shadow-lg px-4 py-3 ${
            isRateLimitError
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <div className="flex items-start gap-3">
            {isRateLimitError ? (
              <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            )}
            <div className="flex-1 space-y-1">
              <p className="font-semibold">
                {isRateLimitError ? "Atenção" : "Erro na consulta"}
              </p>
              <p className="text-sm leading-relaxed">{searchError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-32 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center gap-8">
          <div className="w-full space-y-8 flex flex-col items-center">
            <FadeIn delay={0}>
                <Badge variant="outline" className="rounded-full px-4 py-1.5 border-primary/20 bg-primary/5 text-primary text-sm font-medium">
                Validação de GTIN para Reforma Tributária
                </Badge>
            </FadeIn>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight text-primary min-h-[3.6em] md:min-h-[2.4em]">
              <Typewriter text="A fonte essencial de dados fiscais e cadastrais por GTIN" delay={40} />
            </h1>
            <FadeIn delay={0.2}>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xxl">
                Consulte dados de produtos pelo código de barras: descrição, marca, NCM, CEST e muito mais.
                </p>
            </FadeIn>
            
            <FadeIn delay={0.4}>
                <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full max-w-md relative">
                    <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input 
                        type="text" 
                        placeholder="Digite um GTIN (ex: 7894900011517)" 
                        className="w-full h-14 pl-12 pr-4 rounded-full border border-primary/20 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base"
                        value={gtinInput}
                        onChange={(e) => setGtinInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSearch();
                          }
                        }}
                        disabled={isSearching}
                    />
                    <Button 
                        className="absolute right-2 top-2 bottom-2 rounded-full px-6 bg-primary hover:bg-primary/90 text-white font-medium disabled:opacity-50"
                        onClick={() => handleSearch()}
                        disabled={isSearching}
                    >
                        {isSearching ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Buscando...
                          </>
                        ) : (
                          "Consultar"
                        )}
                    </Button>
                    </div>
                    
                    <div className="mt-3 flex flex-wrap gap-2 px-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Exemplos:</span>
                    {["7894900011517", "7891000100103", "7896004001358"].map(gtin => (
                        <button 
                          key={gtin} 
                          className="text-xs bg-primary/5 hover:bg-primary/10 text-primary px-2 py-0.5 rounded-full transition-colors border border-primary/10 font-mono disabled:opacity-50"
                          onClick={() => handleExampleClick(gtin)}
                          disabled={isSearching}
                        >
                        {gtin}
                        </button>
                    ))}
                    </div>
                    
                </div>
                </div>
            </FadeIn>
            
            <FadeIn delay={0.6}>
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground pt-4">
                <div className="flex -space-x-2">
                    {FAKE_COMPANY_NAMES.map((company) => (
                    <div 
                        key={company} 
                        className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium overflow-hidden"
                        title={company}
                    >
                        <div className="w-full h-full bg-linear-to-br from-primary/20 to-primary/40" />
                    </div>
                    ))}
                </div>
                <p>Usado por escritórios contábeis, varejistas e empresas de todo o Brasil</p>
                </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <Dialog open={isResultOpen && !!searchResult} onOpenChange={setIsResultOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Produto encontrado
            </DialogTitle>
            <DialogDescription>Resultado da consulta pelo GTIN informado.</DialogDescription>
          </DialogHeader>

          {searchResult && (
            <div className="space-y-4">
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">GTIN:</span>
                  <span className="ml-2 font-mono text-primary">{searchResult.gtin}</span>
                </div>
                
                {searchResult.product_name && (
                  <div>
                    <span className="font-medium text-muted-foreground">Produto:</span>
                    <span className="ml-2 text-foreground">{searchResult.product_name}</span>
                  </div>
                )}
                
                {searchResult.brand && (
                  <div>
                    <span className="font-medium text-muted-foreground">Marca:</span>
                    <span className="ml-2 text-foreground">{searchResult.brand}</span>
                  </div>
                )}
                
                {searchResult.ncm && (
                  <div>
                    <span className="font-medium text-muted-foreground">NCM:</span>
                    <span className="ml-2 font-mono text-primary">{searchResult.ncm_formatted || searchResult.ncm}</span>
                  </div>
                )}
                
                {searchResult.cest && Array.isArray(searchResult.cest) && searchResult.cest.length > 0 && (
                  <div>
                    <span className="font-medium text-muted-foreground">CEST:</span>
                    <span className="ml-2 font-mono text-primary">{searchResult.cest.join(", ")}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  Crie uma conta gratuita para consultas ilimitadas e recursos adicionais
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stats Section */}
      <section className="py-20 bg-[#0F172A] text-white">
        <div className="max-w-4xl mx-auto px-6 text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold mb-6">
            Mais de 30 milhões de produtos cadastrados, prontos para consulta imediata.
          </h2>
          <p className="text-lg text-white/60">
          Uma base completa e atualizada para você tomar decisões seguras no seu dia a dia fiscal e comercial.
          </p>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12 text-center">
          <FadeIn delay={0.1} className="space-y-2">
            <div className="text-5xl md:text-6xl font-bold text-emerald-400 font-mono tracking-tight">+30M</div>
            <p className="text-white/60 text-sm uppercase tracking-wider font-medium">Produtos Cadastrados</p>
          </FadeIn>
          <FadeIn delay={0.2} className="space-y-2">
            <div className="text-5xl md:text-6xl font-bold text-emerald-400 font-mono tracking-tight">+5MIL</div>
            <p className="text-white/60 text-sm uppercase tracking-wider font-medium">Consultas por mês</p>
          </FadeIn>
          <FadeIn delay={0.3} className="space-y-2">
            <div className="text-5xl md:text-6xl font-bold text-emerald-400 font-mono tracking-tight">24h</div>
            <p className="text-white/60 text-sm uppercase tracking-wider font-medium">De disponibilidade</p>
          </FadeIn>
        </div>
      </section>

      {/* Why Use Section */}
      <section className="py-24 bg-accent/30">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-primary mb-6">
            Por que usar a PESQUISA GTIN?
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            Cadastros inconsistentes geram retrabalho, erro fiscal e perda de margem. 
            A PESQUISA GTIN centraliza dados cadastrais e fiscais em um único lugar para seu time 
            consultar com rapidez e confiança — sem planilhas e sem processos manuais.
          </p>
        </div>
      </section>

      {/* Benefits Grid */}
      <section id="benefits" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Database,
                title: "Base completa",
                description: "Mais de 30 milhões de produtos cadastrados com dados atualizados para você consultar a qualquer momento."
              },
              {
                icon: Zap,
                title: "Resultado imediato",
                description: "Digite o código de barras e receba os dados do produto em segundos, sem burocracia."
              },
              {
                icon: Search,
                title: "Informações detalhadas",
                description: "NCM, CEST, descrição, marca, origem, peso e datas de atualização em uma única consulta."
              },
              {
                icon: FileText,
                title: "Consulta pelo painel",
                description: "Interface simples e intuitiva para consultar produtos sem necessidade de conhecimento técnico."
              },
              {
                icon: ShieldCheck,
                title: "Segurança e controle",
                description: "Seus dados protegidos, com histórico de consultas e limites claros por plano."
              },
              {
                icon: CheckCircle2,
                title: "Conformidade Fiscal",
                description: "Dados padronizados para evitar erros de tributação e garantir conformidade nas operações."
              }
            ].map((feature, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <Card className="group hover:-translate-y-1 transition-all duration-300 border-border/50 shadow-sm hover:shadow-md bg-card h-full">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl text-primary">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* MVP Features List */}
      <section id="features" className="py-24 bg-white border-y border-border/50">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 space-y-8">
            <FadeIn>
              <h2 className="text-3xl md:text-4xl font-semibold text-primary">
                O que você consegue fazer agora
              </h2>
            </FadeIn>
            <ul className="space-y-4">
              {[
                "Consulta individual de GTIN pelo painel",
                "Consulta em lote — vários produtos de uma só vez",
                /*"Pesquisa por nome, marca ou descrição do produto",*/
                "Painel com histórico de consultas e limites do plano",
                "Dados completos: NCM, CEST, marca, peso, origem e mais",
                "Acesso de qualquer dispositivo — computador, tablet ou celular",
                /*"Resultados atualizados diariamente"*/
              ].map((item, i) => (
                <FadeIn key={i} delay={i * 0.1} direction="left">
                  <li className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-lg text-muted-foreground">{item}</span>
                  </li>
                </FadeIn>
              ))}
            </ul>
            <FadeIn delay={0.4}>
              <Button asChild className="mt-4 rounded-full px-8 bg-primary hover:bg-primary/90 text-white">
                <Link href="/login">Explorar o Painel</Link>
              </Button>
            </FadeIn>
          </div>
          <div className="order-1 lg:order-2 bg-accent/20 rounded-2xl p-8 border border-accent/50">
            <div className="bg-white rounded-xl shadow-sm border border-border/50 p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <div className="space-y-1">
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-24 bg-muted/50 rounded animate-pulse" />
                </div>
                <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-muted/30" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-3/4 bg-muted rounded" />
                      <div className="h-2 w-1/2 bg-muted/50 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-primary/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-primary mb-4">Como funciona</h2>
            <p className="text-lg text-muted-foreground">Simples assim, em três passos</p>
          </div>
          
          <div className="relative">
            <div className="hidden md:block absolute top-8 left-0 right-0 h-0.5 bg-primary/10 -z-10" />
            
            <div className="grid md:grid-cols-3 gap-12">
              {[
                { step: "01", title: "Informe o código", desc: "Digite o GTIN (código de barras) do produto que deseja consultar." },
                { step: "02", title: "Receba os dados", desc: "Em segundos, você visualiza descrição, NCM, CEST, marca e mais." },
                { step: "03", title: "Use no seu negócio", desc: "Utilize as informações para cadastro, conferência fiscal ou tomada de decisão." }
              ].map((item, i) => (
                <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-border/50 text-center relative">
                  <div className="w-16 h-16 mx-auto bg-accent text-primary text-xl font-bold rounded-2xl flex items-center justify-center mb-6 border-4 border-white shadow-sm">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-primary mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="casos-de-uso" className="py-24 px-6 bg-primary text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              Feito para quem precisa consultar produtos no dia a dia
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Independente do seu segmento, o Pesquisa GTIN resolve a necessidade de dados cadastrais e fiscais confiáveis.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: FileText,
                title: "Contabilidade",
                description: "Confira NCM e CEST dos produtos dos seus clientes para classificação fiscal correta."
              },
              {
                icon: Users,
                title: "Varejo e Comércio",
                description: "Cadastre produtos com dados completos e evite erros na emissão de notas fiscais."
              },
              {
                icon: Database,
                title: "Indústria e Distribuição",
                description: "Valide informações de milhares de itens para manter seu catálogo sempre atualizado."
              },
              {
                icon: ShieldCheck,
                title: "Auditoria e Compliance",
                description: "Verifique dados tributários rapidamente para garantir conformidade nas operações."
              }
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 h-full">
                  <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-white/70 text-sm leading-relaxed">{item.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button asChild className="bg-white text-primary hover:bg-white/90 rounded-full px-8 h-12">
              <Link href="/register">Criar conta gratuita</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-semibold text-primary mb-4">Planos e Limites</h2>
            <p className="text-lg text-muted-foreground">
              Para cada uso.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Starter */}
            <FadeIn delay={0.1}>
              <Card className="border-border/50 shadow-sm hover:shadow-md transition-all h-full">
                <CardHeader>
                  <CardTitle className="text-2xl font-semibold text-primary">Starter</CardTitle>
                  <CardDescription className="text-base">Para pequenos projetos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-3xl font-bold text-primary">R$ 199,90<span className="text-sm font-normal text-muted-foreground">/mês</span></div>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Até 5.000 consultas/mês
                    </li>
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Acesso ao Painel completo
                    </li>
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Histórico de consultas
                    </li>
                  </ul>
                  <Link href="/register">
                    <Button className="w-full rounded-full bg-primary/10 text-primary hover:bg-primary/20 shadow-none border-0">
                      Assinar Starter
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </FadeIn>

            {/* Pro */}
            <FadeIn delay={0.2} className="relative z-10">
              <Card className="border-primary shadow-lg scale-105 relative bg-white h-full">
                <div className="absolute top-0 right-0 -mt-3 mr-4 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  Popular
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl font-semibold text-primary">Pro</CardTitle>
                  <CardDescription className="text-base">Para crescimento</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-3xl font-bold text-primary">R$ 399,90<span className="text-sm font-normal text-muted-foreground">/mês</span></div>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2 text-sm text-primary font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Até 10.000 consultas/mês
                    </li>
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Prioridade no processamento
                    </li>
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Consultas em lote
                    </li>
                  </ul>
                  <Link href="/register">
                    <Button className="w-full rounded-full bg-primary hover:bg-primary/90 text-white">
                      Assinar Pro
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </FadeIn>

            {/* Advanced */}
            <FadeIn delay={0.3}>
              <Card className="border-border/50 shadow-sm hover:shadow-md transition-all bg-slate-50 h-full">
                <CardHeader>
                  <CardTitle className="text-2xl font-semibold text-primary">Advanced</CardTitle>
                  <CardDescription className="text-base">Para grandes volumes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-3xl font-bold text-primary">R$ 799,90<span className="text-sm font-normal text-muted-foreground">/mês</span></div>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Até 20.000 consultas/mês
                    </li>
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Suporte prioritário
                    </li>
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Múltiplos usuários na conta
                    </li>
                  </ul>
                  <Link href="/register">
                    <Button variant="outline" className="w-full rounded-full border-primary/20 text-primary hover:bg-primary/5">
                      Assinar Advanced
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
          
          
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary/5 border-t border-border/50 pt-16 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <img 
                  src="/landing/logo.png" 
                  alt="PESQUISA GTIN" 
                  className="h-10 w-auto"
                />
                <span className="text-xl font-semibold tracking-tight text-primary">PESQUISA GTIN</span>
              </div>
              <p className="text-muted-foreground max-w-sm mb-6">
                Consulta de código de barras em conformidade com a LGPD. 
                A plataforma segura para dados cadastrais e fiscais de produtos.
              </p>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-white border border-border/50 flex items-center justify-center text-primary/60 hover:text-primary cursor-pointer transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-primary mb-6">Produto</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-primary">Funcionalidades</Link></li>
                <li><Link href="#pricing" className="hover:text-primary">Preços</Link></li>
                <li><Link href="/bulk" className="hover:text-primary">Consulta em Lote</Link></li>
                <li><Link href="/sobre" className="hover:text-primary">Sobre</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-primary mb-6">Suporte</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><Link href="/docs" className="hover:text-primary">Documentação</Link></li>
                <li><a href="mailto:contato@pesquisagtin.com.br?subject=Contato%20Pesquisa%20GTIN" className="hover:text-primary">Fale Conosco</a></li>
                <li><Link href="/termos-de-uso" className="hover:text-primary">Termos de Uso</Link></li>
                <li><Link href="/politica-de-privacidade" className="hover:text-primary">Privacidade</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>&copy; 2025 PESQUISA GTIN. Todos os direitos reservados.</p>
            <p>Feito com dedicação no Brasil.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
