import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="bg-primary/5 border-t border-border/50 pt-16 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <img src="/landing/logo.png" alt="PESQUISA GTIN" className="h-10 w-auto" />
              <span className="text-xl font-semibold tracking-tight text-primary">PESQUISA GTIN</span>
            </div>
            <p className="text-muted-foreground max-w-sm mb-6">
              API de dados de produtos por GTIN para ERPs, software houses e sistemas comerciais.
              Consulte descrição, marca, NCM, CEST e mais — conforme disponibilidade na base.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-primary mb-6">Produto</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="/api" className="hover:text-primary">API</Link></li>
              <li><Link href="/solucao-para-erp" className="hover:text-primary">Para ERPs</Link></li>
              <li><Link href="/api#pricing" className="hover:text-primary">Planos</Link></li>
              <li><Link href="/bulk" className="hover:text-primary">Consulta em massa</Link></li>
              <li><Link href="/sobre" className="hover:text-primary">Sobre</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-primary mb-6">Suporte</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li>
                <Link href="/docs" className="hover:text-primary">
                  Documentação da API
                </Link>
              </li>
              <li>
                <a href="mailto:contato@pesquisagtin.com.br?subject=Contato%20Pesquisa%20GTIN" className="hover:text-primary">
                  Fale Conosco
                </a>
              </li>
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
  );
}
