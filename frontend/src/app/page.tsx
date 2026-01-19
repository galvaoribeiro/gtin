"use client";

import { useEffect, useState } from "react";
import Link from "next/link";   // Adaptado para Next.js
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
  Code2, 
  Terminal,
  Menu,
  X,
  Loader2,
  AlertCircle,
  AlertTriangle
} from "lucide-react";

// Importando os componentes que criamos no Passo 2
import { Typewriter } from "@/components/landing-page/components/ui/typewriter";
import { FadeIn } from "@/components/landing-page/components/ui/fade-in";

// Importar funções de API
import { fetchGtinPublic, type Product, ApiError } from "@/lib/api";

const FAKE_COMPANY_NAMES = [
  "Atlas Contábil",
  "Neon Retail",
  "Delta ERP",
  "Vetta Commerce",
];

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [isRateLimitError, setIsRateLimitError] = useState(false);
  
  // Estados para busca de GTIN
  const [gtinInput, setGtinInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<Product | null>(null);

  // Limpa mensagem de erro automaticamente após alguns segundos
  useEffect(() => {
    if (!searchError) return;
    const timer = setTimeout(() => {
      setSearchError(null);
      setIsRateLimitError(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, [searchError]);
  
  // Função para buscar GTIN
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
  
  // Função para exemplo clicável
  const handleExampleClick = (gtin: string) => {
    setGtinInput(gtin);
    handleSearch(gtin);
  };

  // Função para scroll suave até uma seção
  const handleScrollTo = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setIsMenuOpen(false); // Fechar menu mobile se estiver aberto
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-accent selection:text-primary">
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-primary">GTINX</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => handleScrollTo("benefits")} 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              Benefícios
            </button>
            <button 
              onClick={() => handleScrollTo("features")} 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              Funcionalidades
            </button>
            <button 
              onClick={() => handleScrollTo("api")} 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              API
            </button>
            <button 
              onClick={() => handleScrollTo("pricing")} 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              Planos
            </button>
            <div className="flex items-center gap-4 ml-4">
              <Link href="/login">
                <Button variant="ghost" className="font-medium text-muted-foreground hover:text-primary">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button className="rounded-full px-6 bg-primary hover:bg-primary/90 text-white font-medium">
                  Começar agora
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-background border-b border-border p-6 flex flex-col gap-4 shadow-lg animate-in slide-in-from-top-5">
            <button 
              onClick={() => handleScrollTo("benefits")} 
              className="text-base font-medium text-left cursor-pointer"
            >
              Benefícios
            </button>
            <button 
              onClick={() => handleScrollTo("features")} 
              className="text-base font-medium text-left cursor-pointer"
            >
              Funcionalidades
            </button>
            <button 
              onClick={() => handleScrollTo("api")} 
              className="text-base font-medium text-left cursor-pointer"
            >
              API
            </button>
            <button 
              onClick={() => handleScrollTo("pricing")} 
              className="text-base font-medium text-left cursor-pointer"
            >
              Planos
            </button>
            <div className="h-px bg-border my-2" />
            <Link href="/login" className="w-full">
              <Button variant="ghost" className="justify-start w-full">Login</Button>
            </Link>
            <Link href="/register" className="w-full">
              <Button className="w-full bg-primary text-white">Começar agora</Button>
            </Link>
          </div>
        )}
      </nav>

      {/* Alerta flutuante de erro */}
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
                Automatize seu catálogo com dados precisos em milissegundos. Enriqueça seu ERP e valide NCM/CEST instantaneamente com a maior base de GTINs do mercado.
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
                    
                    {/* Exemplos clicáveis */}
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
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40" />
                    </div>
                    ))}
                </div>
                <p>Usado por contabilidades, e-commerces e ERPs</p>
                </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Modal de resultado da consulta */}
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
              {/* Imagem do produto */}
              {searchResult.image_url && (
                <div className="flex justify-center">
                  <img 
                    src={searchResult.image_url} 
                    alt={searchResult.product_name || "Produto"} 
                    className="max-w-full max-h-64 rounded-lg object-contain border border-border/50"
                    onError={(e) => {
                      // Se a imagem falhar ao carregar, oculta o elemento
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
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
                  💡 Crie uma conta para mais consultas e acesso via API
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
            Mais de 30 milhões de GTINs atualizados, dados que garantem decisões seguras e integração sem erros.
          </h2>
          <p className="text-lg text-white/60">
          Uma API robusta, desenhada para manter sua base sempre atualizada, independentemente do tamanho do seu desafio
          </p>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12 text-center">
          <FadeIn delay={0.1} className="space-y-2">
            <div className="text-5xl md:text-6xl font-bold text-emerald-400 font-mono tracking-tight">+30M</div>
            <p className="text-white/60 text-sm uppercase tracking-wider font-medium">Milhões de Produtos</p>
          </FadeIn>
          <FadeIn delay={0.2} className="space-y-2">
            <div className="text-5xl md:text-6xl font-bold text-emerald-400 font-mono tracking-tight">+5MIL</div>
            <p className="text-white/60 text-sm uppercase tracking-wider font-medium">Consultas por mês</p>
          </FadeIn>
          <FadeIn delay={0.3} className="space-y-2">
            <div className="text-5xl md:text-6xl font-bold text-emerald-400 font-mono tracking-tight">99.9%</div>
            <p className="text-white/60 text-sm uppercase tracking-wider font-medium">Disponibilidade</p>
          </FadeIn>
        </div>
      </section>

      {/* Why Use Section */}
      <section className="py-24 bg-accent/30">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-primary mb-6">
            Por que usar a GTINX?
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            Cadastros inconsistentes geram retrabalho, erro fiscal e perda de margem. 
            A GTINX centraliza dados cadastrais e fiscais em um único lugar para seu time 
            (ou seu ERP) consultar com rapidez e confiança — sem planilhas e sem processos manuais.
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
                title: "Dados em escala",
                description: "Base com mais de 30 milhões de produtos para cobertura ampla em catálogos e integrações."
              },
              {
                icon: Zap,
                title: "Consulta instantânea",
                description: "Respostas rápidas para uso crítico em checkout, cadastro de produtos e auditoria fiscal."
              },
              {
                icon: Search,
                title: "Enriquecimento completo",
                description: "NCM, CEST, descrição, marca, detentor (CNPJ/CPF), origem, peso e datas de atualização."
              },
              {
                icon: Terminal,
                title: "Painel + API",
                description: "Consulte manualmente quando precisa e automatize via API quando faz sentido para seu fluxo."
              },
              {
                icon: ShieldCheck,
                title: "Governança e controle",
                description: "API keys, revogação, limites por plano e métricas de uso detalhadas para sua segurança."
              },
              {
                icon: CheckCircle2,
                title: "Conformidade Fiscal",
                description: "Dados padronizados para evitar erros de tributação e garantir compliance nas operações."
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
                "Consulta individual de GTIN no painel",
                "Consulta individual via API",
                "Consulta em lote (batch) via API (até 10 GTINs por chamada)",
                "Pesquisa (search) via API, com paginação",
                "Gestão de API Keys (criar/renovar/revogar)",
                "Dashboard de uso (chamadas, limites, status do plano)",
                "Exibição completa dos metadados do produto"
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
            {/* Abstract UI representation of the dashboard */}
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
            <p className="text-lg text-muted-foreground">Integração simples em três passos</p>
          </div>
          
          <div className="relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-8 left-0 right-0 h-0.5 bg-primary/10 -z-10" />
            
            <div className="grid md:grid-cols-3 gap-12">
              {[
                { step: "01", title: "Informe o GTIN", desc: "Envie um código ou uma lista de GTINs para nossa API." },
                { step: "02", title: "Processamento", desc: "Nós retornamos os dados padronizados (NCM, CEST, Marca, etc)." },
                { step: "03", title: "Integração", desc: "Você recebe os dados no seu ERP, e-commerce ou catálogo." }
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

      {/* API Section */}
      <section id="api" className="py-24 px-6 bg-primary text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm font-medium text-accent">
              <Code2 className="w-4 h-4" />
              <span>Developer First</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold text-white">
              API de alto desempenho
            </h2>
            <p className="text-lg text-white/80 leading-relaxed">
              Autenticação simples via Bearer API Key, respostas em JSON e contratos claros para integração rápida.
              Ideal para consulta unitária e batch.
            </p>
            <div className="pt-4 flex gap-4">
              <Button asChild className="bg-white text-primary hover:bg-white/90 rounded-full px-8 h-12">
                <Link href="/docs">Explorar Endpoints</Link>
              </Button>

            </div>
            
            <div className="pt-8 flex items-center gap-4 text-white/40 text-sm">
              <span className="uppercase tracking-wider font-semibold text-xs">Built with</span>
              <div className="flex gap-3 items-center">
                <span className="px-2 py-1 rounded bg-white/10 border border-white/10 text-white/80 font-medium">Next.js</span>
                <span className="px-2 py-1 rounded bg-white/10 border border-white/10 text-white/80 font-medium">TypeScript</span>
                <span className="px-2 py-1 rounded bg-white/10 border border-white/10 text-white/80 font-medium">Tailwind</span>
              </div>
            </div>
          </div>
          
          <div className="bg-[#0D1117] rounded-xl border border-white/10 shadow-2xl overflow-hidden font-mono text-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="text-xs text-white/40">GET /v1/products/{'{gtin}'}</div>
            </div>
            <div className="p-6 overflow-x-auto min-h-[300px]">
              <pre className="text-emerald-400 font-mono text-sm leading-relaxed">
                <Typewriter 
                  delay={5} 
                  text={`// Exemplo de resposta
{
  "gtin": "7894900011517",
  "description": "REFRIGERANTE COCA COLA 350ML",
  "brand": "COCA COLA",
  "ncm": "2202.10.00",
  "cest": "03.007.00",
  "origin": 0,
  "gross_weight": 0.365,
  "updated_at": "2024-12-15T10:30:00Z"
}`} 
                />
              </pre>
            </div>
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
                      Acesso ao Painel
                    </li>
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      API Key única
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
                      Prioridade na requisição
                    </li>
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Gestão de até 10 API Keys
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
                      Formato disponível JSON
                    </li>
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Gestão de até 50 API Keys
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

      {/* Security & Footer */}
      <footer className="bg-primary/5 border-t border-border/50 pt-16 pb-12 px-6">
        <div className="max-w-7xl mx-auto mb-16 border-b border-border/50 pb-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">Powered by Modern Tech</h3>
              <p className="text-muted-foreground text-sm">Construído com a melhor stack para performance e escala.</p>
            </div>
            <div className="flex flex-wrap items-center gap-6 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
              {/* Tech Stack Logos */}
              <div className="flex items-center gap-2" title="Next.js">
                <svg viewBox="0 0 180 180" className="w-8 h-8 fill-primary"><path d="M149.508 157.52L69.142 54H54V125.97H66.1136V69.3836L139.999 164.845C143.333 162.614 146.509 160.165 149.508 157.52Z" fill="currentColor"></path></svg>
                <span className="font-bold text-primary">Next.js</span>
              </div>
              <div className="flex items-center gap-2" title="TypeScript">
                <div className="w-8 h-8 bg-[#3178C6] rounded flex items-center justify-center text-white font-bold text-lg">TS</div>
                <span className="font-bold text-primary">TypeScript</span>
              </div>
              <div className="flex items-center gap-2" title="Tailwind CSS">
                <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#38BDF8] fill-current"><path d="M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 C13.666,10.618,15.027,12,18.001,12c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 c1.177,1.194,2.538,2.576,5.512,2.576c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C10.337,13.382,8.976,12,6.001,12z"></path></svg>
                <span className="font-bold text-primary">Tailwind</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-semibold tracking-tight text-primary">GTINX</span>
              </div>
              <p className="text-muted-foreground max-w-sm mb-6">
                Consulta GTIN em conformidade LGPD. 
                A plataforma segura para dados fiscais.
              </p>
              <div className="flex gap-4">
                {/* Social placeholders */}
                <div className="w-10 h-10 rounded-full bg-white border border-border/50 flex items-center justify-center text-primary/60 hover:text-primary cursor-pointer transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
                </div>
                <div className="w-10 h-10 rounded-full bg-white border border-border/50 flex items-center justify-center text-primary/60 hover:text-primary cursor-pointer transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-primary mb-6">Produto</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary">Funcionalidades</Link></li>
                <li><Link href="#" className="hover:text-primary">API</Link></li>
                <li><Link href="#" className="hover:text-primary">Preços</Link></li>
                <li><Link href="#" className="hover:text-primary">Status</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-primary mb-6">Suporte</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary">Documentação</Link></li>
                <li><Link href="#" className="hover:text-primary">Fale Conosco</Link></li>
                <li><Link href="#" className="hover:text-primary">Termos de Uso</Link></li>
                <li><Link href="#" className="hover:text-primary">Privacidade</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© 2025 GTINX Data Platform. Todos os direitos reservados.</p>
            <p>Feito com Next.js e ❤️ no Brasil.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}