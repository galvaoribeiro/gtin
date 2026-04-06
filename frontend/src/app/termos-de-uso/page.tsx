import type { Metadata } from "next";
import Link from "next/link";

import { LandingNavbar } from "@/components/landing-page/LandingNavbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const sections = [
  {
    id: "aceite",
    title: "1. Aceite dos Termos",
    content: [
      "Estes Termos de Uso regulam o acesso e a utilização do site, da plataforma web, da API e dos serviços relacionados ao PESQUISA GTIN, operados por RM Assessoria e Consultoria Ltda, inscrita no CNPJ 42.029.950/0001-99, com sede em Porto Velho-RO.",
      "Ao acessar, navegar, criar conta, contratar plano, utilizar a API, enviar listas para processamento em lote ou usar qualquer funcionalidade do serviço, o usuário declara ter lido, compreendido e aceitado integralmente estes Termos. Caso não concorde, não deverá utilizar o serviço.",
      "Se o usuário estiver utilizando o serviço em nome de uma empresa, declara possuir poderes suficientes para vinculá-la a estes Termos.",
    ],
  },
  {
    id: "elegibilidade",
    title: "2. Elegibilidade e cadastro",
    content: [
      "O serviço é direcionado principalmente a uso profissional e empresarial, inclusive por ERPs, e-commerces, integradores, escritórios contábeis, times fiscais e áreas de cadastro de produtos.",
      "O usuário deve fornecer informações cadastrais verdadeiras, atualizadas e completas, mantendo sob sua responsabilidade a correção dos dados informados na conta e nos meios de pagamento vinculados.",
      "O acesso ao ambiente autenticado depende de credenciais válidas. O usuário é responsável por preservar a confidencialidade de login, senha, token e chaves de API, respondendo por todo uso realizado a partir dessas credenciais.",
    ],
  },
  {
    id: "servicos",
    title: "3. Serviços abrangidos",
    content: [
      "O PESQUISA GTIN oferece, entre outras funcionalidades, consulta de dados de produtos por GTIN, visualização em ambiente web, acesso a endpoints de API, gestão de chaves de API, métricas de uso, recursos de assinatura e, quando contratado separadamente, processamento em lote de listas enviadas pelo cliente.",
      "Os serviços podem incluir dados cadastrais, fiscais e comerciais de produtos, como GTIN, descrição, marca, NCM, CEST, origem, pesos, datas de atualização e outros campos eventualmente disponíveis em cada resposta.",
      "A disponibilidade de campos, volumes, quotas, rate limits, processamento em lote, integrações e recursos específicos pode variar conforme o plano contratado, o canal utilizado, a documentação técnica vigente e as restrições operacionais da plataforma.",
    ],
  },
  {
    id: "planos",
    title: "4. Planos, cobrança, cancelamento e reembolso",
    content: [
      "O serviço pode ser oferecido em modalidade gratuita, modalidades pagas recorrentes e serviços avulsos ou sob proposta comercial, como processamento em lote. Os preços, limites e condições comerciais vigentes são os divulgados no site, no checkout, na documentação comercial ou em proposta específica.",
      "Nos planos recorrentes, a cobrança é feita de forma periódica, em regra mensal, por meio do provedor de pagamento adotado pela plataforma. O usuário autoriza as cobranças recorrentes até que promova o cancelamento pelos meios disponibilizados.",
      "O cancelamento da assinatura interrompe renovações futuras e produz efeitos ao final do ciclo já pago, salvo previsão diferente exigida por lei ou informada no fluxo de contratação.",
      "Salvo obrigação legal em sentido contrário ou cobrança comprovadamente indevida, não há reembolso proporcional por período parcialmente utilizado, por saldo não consumido, por franquia não utilizada ou por mera desistência após o início do ciclo.",
      "A plataforma poderá suspender, restringir ou cancelar acessos em caso de inadimplência, suspeita de fraude, chargeback, uso abusivo, violação destes Termos, risco técnico ou descumprimento de exigências do provedor de pagamento.",
    ],
  },
  {
    id: "uso-permitido",
    title: "5. Uso permitido e condutas vedadas",
    content: [
      "O usuário deve utilizar o serviço de forma lícita, ética, compatível com sua finalidade e em conformidade com a legislação aplicável, inclusive normas de proteção de dados, propriedade intelectual, concorrência, defesa do consumidor e regulação setorial eventualmente incidente sobre sua atividade.",
      "É vedado, sem autorização expressa da RM Assessoria e Consultoria Ltda: revender o serviço como banco de dados próprio; sublicenciar ou compartilhar acesso de forma indevida; contornar limites técnicos ou comerciais; realizar scraping abusivo; sobrecarregar deliberadamente a infraestrutura; tentar acessar áreas restritas; praticar engenharia reversa indevida; ou utilizar o serviço para fins ilícitos, discriminatórios, fraudulentos ou lesivos a terceiros.",
      "As chaves de API, credenciais e tokens são pessoais e vinculados à conta ou organização contratante, não devendo ser expostos publicamente, embutidos em aplicações cliente sem proteção adequada ou compartilhados fora da equipe autorizada.",
    ],
  },
  {
    id: "dados-fontes",
    title: "6. Dados, fontes, limitações técnicas e ausência de garantia",
    content: [
      "O PESQUISA GTIN trabalha com base própria, rotinas de tratamento e enriquecimento de dados, fontes públicas, informações de terceiros e processos automatizados de normalização, indexação, busca e disponibilização de resultados.",
      "Em razão da natureza das fontes, do tempo de atualização, de mudanças externas e de limitações técnicas inerentes, os dados podem apresentar defasagem, inconsistências, omissões, indisponibilidades, duplicidades ou divergências.",
      "A RM Assessoria e Consultoria Ltda não garante exatidão absoluta, completude, atualidade contínua, adequação a finalidade específica, disponibilidade ininterrupta, ausência de erro ou resultado comercial esperado. Cabe ao usuário validar as informações antes de utilizá-las em decisões fiscais, cadastrais, regulatórias, logísticas, comerciais ou estratégicas.",
      "As informações disponibilizadas não constituem parecer jurídico, contábil, fiscal, regulatório ou consultoria profissional personalizada. A responsabilidade pela interpretação e pelo uso das informações é exclusivamente do usuário.",
    ],
  },
  {
    id: "bulk-api",
    title: "7. Regras específicas para API e processamento em lote",
    content: [
      "O uso da API está sujeito a autenticação válida, quotas, limites de requisição, limites de batch, políticas antiabuso e demais regras técnicas divulgadas na documentação e aplicadas pela plataforma.",
      "A existência de um plano pago, de uma chave ativa ou de uma contratação comercial não elimina a aplicação de limites de segurança, rate limits, janelas de manutenção, filas internas, revisões manuais ou medidas de contenção operacional.",
      "Nos serviços de processamento em lote, os prazos de entrega são estimativas operacionais e podem variar conforme volume, qualidade dos arquivos enviados, disponibilidade de dados, fila de processamento e validações necessárias. Arquivos inválidos, incompletos ou fora do padrão podem ser recusados ou exigir novo envio.",
    ],
  },
  {
    id: "propriedade",
    title: "8. Propriedade intelectual",
    content: [
      "A plataforma, sua identidade visual, software, documentação, base estruturada, organização de conteúdos, métodos de apresentação, marcas, logotipos, layouts, textos e demais elementos protegidos pertencem ou são licenciados à RM Assessoria e Consultoria Ltda.",
      "Estes Termos não transferem ao usuário qualquer direito de propriedade intelectual, exceto a licença limitada, revogável, não exclusiva e intransferível para uso do serviço conforme sua finalidade contratada.",
      "É proibida a reprodução, distribuição, extração sistemática, publicação, espelhamento, comercialização ou reutilização substancial do conteúdo e da estrutura do serviço fora das hipóteses expressamente permitidas pela plataforma ou pela lei.",
    ],
  },
  {
    id: "suspensao",
    title: "9. Disponibilidade, mudanças e suspensão",
    content: [
      "A plataforma poderá realizar atualizações, correções, alterações de interface, mudanças de funcionalidades, ajustes de limites, interrupções programadas e medidas de segurança sem necessidade de aviso individual prévio, ressalvadas obrigações legais específicas.",
      "A RM Assessoria e Consultoria Ltda poderá, a seu critério e mediante avaliação de risco, suspender temporariamente funcionalidades, consultas, integrações, contas, chaves de API ou acessos quando identificar abuso, instabilidade, risco à infraestrutura, suspeita de uso indevido ou necessidade de manutenção.",
      "A continuidade do uso após atualização relevante destes Termos representa concordância com a versão então vigente, observada a data de publicação indicada nesta página.",
    ],
  },
  {
    id: "responsabilidade",
    title: "10. Limitação de responsabilidade e indenização",
    content: [
      "Na máxima extensão permitida pela legislação aplicável, a RM Assessoria e Consultoria Ltda não responderá por danos indiretos, lucros cessantes, perda de receita, perda de oportunidade, perda de dados, danos reputacionais, decisões automatizadas do usuário, autuações de terceiros ou prejuízos decorrentes do uso, mau uso ou confiança depositada nas informações disponibilizadas.",
      "Também não haverá responsabilidade por falhas decorrentes de terceiros, indisponibilidade de internet, problemas em provedores externos, eventos de força maior, atos de autoridades, falhas de integrações, condutas do usuário ou credenciais comprometidas por culpa do próprio usuário ou de sua organização.",
      "O usuário concorda em defender, indenizar e manter indene a RM Assessoria e Consultoria Ltda em relação a reclamações, perdas, custos e despesas resultantes de uso ilícito do serviço, violação destes Termos, violação de direitos de terceiros ou uso inadequado dos dados obtidos na plataforma.",
    ],
  },
  {
    id: "privacidade",
    title: "11. Privacidade e proteção de dados",
    content: [
      "A plataforma pode tratar dados necessários à autenticação, cobrança, prevenção a abuso, suporte, métricas de uso e operação do serviço, observados os fundamentos legais aplicáveis.",
      "Solicitações relacionadas a dados pessoais, privacidade, exercício de direitos ou comunicações jurídicas poderão ser encaminhadas para contato@pesquisagtin.com.br.",
      "O usuário é o único responsável pelo tratamento posterior que realizar com os dados obtidos por meio do serviço, inclusive quanto à base legal adequada, transparência, segurança e cumprimento da LGPD e demais normas aplicáveis ao seu negócio.",
    ],
  },
  {
    id: "vigencia",
    title: "12. Vigência, rescisão e foro",
    content: [
      "Estes Termos vigoram por prazo indeterminado, a partir do primeiro acesso ou utilização do serviço, e permanecerão aplicáveis enquanto houver uso da plataforma, conta ativa, assinatura vigente ou obrigações remanescentes entre as partes.",
      "A RM Assessoria e Consultoria Ltda poderá rescindir ou encerrar o acesso ao serviço mediante violação destes Termos, obrigação legal, risco operacional relevante, encerramento de produto ou impossibilidade técnica/comercial de continuidade.",
      "Fica eleito o foro da Comarca de Porto Velho-RO, com renúncia a qualquer outro, por mais privilegiado que seja, para dirimir controvérsias decorrentes destes Termos, observada a legislação brasileira aplicável.",
    ],
  },
];

export const metadata: Metadata = {
  title: "Termos de Uso | Pesquisa GTIN",
  description:
    "Leia os Termos de Uso do Pesquisa GTIN para consulta web, API, assinaturas e processamento em lote.",
  alternates: {
    canonical: "https://pesquisagtin.com.br/termos-de-uso",
  },
};

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNavbar variant="simple" />

      <main className="pt-24 md:pt-28">
        <section className="border-b border-border/50 bg-primary/5 px-6 py-14 md:py-20">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-5">
              <Badge variant="secondary" className="rounded-full px-4 py-1">
                Documento legal do serviço
              </Badge>
              <div className="space-y-4">
                <h1 className="text-3xl font-semibold tracking-tight text-primary md:text-5xl">
                  Termos de Uso do Pesquisa GTIN
                </h1>
                <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
                  Estes Termos disciplinam o uso do site, da plataforma, da API e dos serviços
                  relacionados ao Pesquisa GTIN, com foco em consulta e enriquecimento cadastral e
                  fiscal de produtos por GTIN.
                </p>
              </div>
              <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                <div>
                  <span className="font-medium text-foreground">Empresa:</span> RM Assessoria e
                  Consultoria Ltda
                </div>
                <div>
                  <span className="font-medium text-foreground">CNPJ:</span> 42.029.950/0001-99
                </div>
                <div>
                  <span className="font-medium text-foreground">Sede:</span> Porto Velho-RO
                </div>
                <div>
                  <span className="font-medium text-foreground">Contato jurídico:</span>{" "}
                  <a
                    href="mailto:contato@pesquisagtin.com.br"
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    contato@pesquisagtin.com.br
                  </a>
                </div>
              </div>
            </div>

            <Card className="w-full max-w-xl border-border/70 shadow-sm">
              <CardHeader className="space-y-3">
                <CardTitle className="text-xl text-primary">Resumo prático</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                <p>
                  O serviço é fornecido em base contínua e pode incluir plano gratuito, planos
                  pagos, API, dashboard, chaves de acesso e serviços em lote sob demanda.
                </p>
                <p>
                  Os dados podem ter defasagem ou divergências e devem ser validados pelo usuário
                  antes de qualquer decisão fiscal, comercial, cadastral ou regulatória.
                </p>
                <p>
                  Cancelamentos de assinatura impedem novas renovações e produzem efeitos ao final
                  do ciclo pago, sem reembolso proporcional, salvo obrigação legal em contrário.
                </p>
                <p>
                  O uso abusivo, fraudulento, ilícito ou que comprometa a infraestrutura pode gerar
                  limitação, suspensão ou encerramento de acesso.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="px-6 py-12 md:py-16">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[280px_1fr]">
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="text-base text-primary">Nesta página</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="block text-muted-foreground transition-colors hover:text-primary"
                    >
                      {section.title}
                    </a>
                  ))}
                </CardContent>
              </Card>
            </aside>

            <div className="space-y-10">
              {sections.map((section, index) => (
                <section key={section.id} id={section.id} className="scroll-mt-24 space-y-4">
                  <h2 className="text-2xl font-semibold text-primary">{section.title}</h2>
                  <div className="space-y-4">
                    {section.content.map((paragraph) => (
                      <p
                        key={paragraph}
                        className="text-sm leading-7 text-muted-foreground md:text-base"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  {index < sections.length - 1 ? <Separator className="mt-8" /> : null}
                </section>
              ))}

              <Card className="border-border/70 bg-accent/20">
                <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-primary">Dúvidas jurídicas ou comerciais?</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Entre em contato para assuntos contratuais, privacidade, faturamento,
                      processamento em lote ou uso corporativo da API.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button asChild className="rounded-full px-6">
                      <a href="mailto:contato@pesquisagtin.com.br?subject=Assunto%20jur%C3%ADdico%20ou%20comercial">
                        Falar com a equipe
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="rounded-full px-6">
                      <Link href="/docs">Ver documentação da API</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="text-xs text-muted-foreground">
                Última atualização: 05 de abril de 2026.
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
