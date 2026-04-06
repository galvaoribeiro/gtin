import type { Metadata } from "next";
import Link from "next/link";

import { LandingNavbar } from "@/components/landing-page/LandingNavbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const sections = [
  {
    id: "introducao",
    title: "1. Introdução",
    content: [
      "Esta Política de Privacidade descreve como a RM Assessoria e Consultoria Ltda, inscrita no CNPJ 42.029.950/0001-99, com sede em Porto Velho-RO, trata dados pessoais no contexto do site, da plataforma, da API e dos serviços relacionados ao Pesquisa GTIN.",
      "O documento foi elaborado para refletir o funcionamento atual do produto, incluindo cadastro, autenticação, uso da plataforma, cobrança, prevenção a abuso, suporte e navegação em páginas públicas.",
      "Ao utilizar os serviços, o usuário declara estar ciente das práticas aqui descritas. Esta Política deve ser lida em conjunto com os Termos de Uso.",
    ],
  },
  {
    id: "controladora",
    title: "2. Controladora e canal de contato",
    content: [
      "A controladora dos dados tratados no contexto desta Política é a RM Assessoria e Consultoria Ltda.",
      "Dados da controladora: CNPJ 42.029.950/0001-99, sede em Porto Velho-RO, e-mail para assuntos jurídicos, privacidade e exercício de direitos: contato@pesquisagtin.com.br.",
      "Comunicações relacionadas a LGPD, solicitações do titular, dúvidas contratuais ou reporte de incidente podem ser encaminhadas para esse canal.",
    ],
  },
  {
    id: "dados-coletados",
    title: "3. Dados que tratamos",
    content: [
      "Podemos tratar dados cadastrais e de autenticação, como e-mail, senha armazenada de forma protegida por hash, nome da organização vinculada à conta, identificadores internos do usuário e da organização, e informações de status da conta.",
      "Também tratamos dados operacionais e de uso, como métricas de utilização da plataforma e da API, identificadores de chaves de API, registros técnicos de autenticação, limites de uso, status de assinatura, informações de cobrança, datas de criação e histórico operacional necessário ao funcionamento do serviço.",
      "Em contextos de segurança e prevenção a abuso, podemos tratar endereço IP, informações de rate limiting, dados mínimos de sessão, eventos técnicos e sinais compatíveis com proteção da infraestrutura, estabilidade do serviço e detecção de comportamento indevido.",
      "Quando há contratação de planos pagos, também tratamos dados relacionados à cobrança, como identificadores de cliente e assinatura no Stripe, faturas, status de pagamento, últimos dígitos do cartão, bandeira, validade e método de pagamento padrão, sem armazenar o número completo do cartão em nossos sistemas.",
    ],
  },
  {
    id: "origem",
    title: "4. Como os dados são coletados",
    content: [
      "Os dados podem ser fornecidos diretamente pelo usuário ao criar conta, fazer login, contratar plano, abrir chamado, usar a plataforma web, gerar chaves de API, interagir com o checkout ou entrar em contato com a equipe.",
      "Também coletamos dados automaticamente por meios técnicos quando o usuário navega pelo site, acessa áreas autenticadas, interage com o dashboard, utiliza a API ou aciona recursos de segurança e limitação de uso.",
      "Determinadas informações podem ser recebidas de terceiros que viabilizam o serviço, especialmente o provedor de pagamentos e os serviços de infraestrutura e segurança necessários à operação da plataforma.",
    ],
  },
  {
    id: "finalidades",
    title: "5. Finalidades do tratamento e bases legais",
    content: [
      "Tratamos dados para criar e administrar contas, autenticar usuários, disponibilizar acesso ao painel, manter sessões ativas, permitir o uso de chaves de API e entregar os serviços contratados. Nesses casos, o tratamento se apoia principalmente na execução de contrato e em procedimentos preliminares relacionados ao contrato.",
      "Também tratamos dados para cobrança, emissão de informações relacionadas à assinatura, prevenção a fraude, proteção da infraestrutura, aplicação de limites de uso, investigação de incidentes, atendimento de suporte e defesa em processos administrativos ou judiciais. Essas atividades podem se basear em cumprimento de obrigação legal, exercício regular de direitos e legítimo interesse.",
      "Quando aplicável, o tratamento poderá ainda ocorrer para atendimento de requisições de autoridades competentes, cumprimento regulatório, auditoria, segurança da informação e melhoria controlada da experiência do usuário.",
    ],
  },
  {
    id: "compartilhamento",
    title: "6. Compartilhamento com terceiros",
    content: [
      "Os dados poderão ser compartilhados com operadores e prestadores de serviço estritamente necessários para viabilizar o funcionamento da plataforma, como provedores de hospedagem, banco de dados, autenticação técnica, infraestrutura, segurança, monitoramento e suporte operacional.",
      "Para cobrança, pagamentos, gestão de assinaturas, invoices e métodos de pagamento, utilizamos o Stripe, que poderá tratar dados necessários à criação de customer, checkout, portal de cobrança, faturas e gerenciamento de meios de pagamento.",
      "Poderemos compartilhar dados com autoridades públicas, órgãos reguladores ou partes legitimadas quando houver obrigação legal, ordem judicial, requisição válida ou necessidade de proteger direitos, prevenir fraude, investigar abuso ou assegurar a continuidade e segurança do serviço.",
      "Não comercializamos listas de dados pessoais de usuários finais da plataforma como atividade autônoma de mercado.",
    ],
  },
  {
    id: "cookies",
    title: "7. Cookies, armazenamento local e tecnologias similares",
    content: [
      "O Pesquisa GTIN utiliza tecnologias necessárias ao funcionamento da interface e da autenticação. Atualmente, isso inclui ao menos um cookie funcional para preferência de interface (`sidebar_state`) e armazenamento local no navegador para persistência do token de autenticação (`auth_token`).",
      "O cookie funcional é utilizado para lembrar o estado visual da sidebar e melhorar a experiência de navegação no painel. O armazenamento local é usado para manter a sessão autenticada do usuário no navegador, permitindo acesso contínuo às áreas protegidas até logout, expiração ou remoção do token.",
      "Esses mecanismos são utilizados com finalidade operacional e de segurança. A desativação manual pelo navegador pode impactar o funcionamento normal da plataforma, exigindo novo login ou redefinição de preferências de interface.",
      "O usuário pode gerenciar, bloquear ou excluir cookies e armazenamento local nas configurações do próprio navegador. Em caso de exclusão, certos recursos poderão deixar de funcionar corretamente até que novos dados técnicos sejam gerados em uma navegação posterior.",
    ],
  },
  {
    id: "retencao",
    title: "8. Retenção e descarte",
    content: [
      "Os dados pessoais serão mantidos pelo período necessário para cumprir as finalidades descritas nesta Política, atender exigências legais, resguardar direitos da controladora, solucionar disputas, prevenir fraude e manter a rastreabilidade mínima de eventos operacionais e financeiros.",
      "Prazos de retenção podem variar conforme a categoria do dado, o tipo de relação com o usuário, a existência de obrigação legal ou regulatória, o ciclo contratual, demandas de auditoria, cobrança, suporte, segurança ou defesa em processos.",
      "Quando cabível e tecnicamente possível, os dados são excluídos, anonimizados ou desassociados da identidade do titular após o encerramento da finalidade e o decurso do prazo de retenção aplicável.",
    ],
  },
  {
    id: "direitos",
    title: "9. Direitos do titular",
    content: [
      "Nos termos da legislação aplicável, especialmente a LGPD, o titular pode solicitar confirmação da existência de tratamento, acesso, correção de dados incompletos ou desatualizados, anonimização, bloqueio ou eliminação quando cabível, portabilidade, informação sobre compartilhamentos e revisão de decisões eventualmente sujeitas às hipóteses legais.",
      "Quando o tratamento depender de consentimento, o titular também poderá solicitar a revogação, observadas as consequências práticas dessa revogação para funcionalidades eventualmente dependentes desse fundamento.",
      "Algumas solicitações podem ser limitadas por obrigação legal, segredo comercial, proteção de direitos de terceiros, segurança da plataforma, impossibilidade técnica razoável ou necessidade de retenção mínima para exercício regular de direitos.",
      "Pedidos devem ser enviados para contato@pesquisagtin.com.br, com informações suficientes para identificação do solicitante e da demanda.",
    ],
  },
  {
    id: "seguranca",
    title: "10. Segurança da informação",
    content: [
      "Adotamos medidas técnicas e organizacionais razoáveis para proteger dados pessoais contra acessos não autorizados, perda, destruição, alteração, divulgação indevida e outras formas de tratamento inadequado ou ilícito, de acordo com a natureza do serviço e os riscos envolvidos.",
      "Essas medidas podem incluir controle de autenticação, segregação de acesso, monitoramento, mecanismos de rate limiting, proteção de credenciais, uso de provedores especializados e revisão operacional de eventos de segurança.",
      "Apesar disso, nenhum ambiente digital é absolutamente inviolável. Por essa razão, não é possível garantir segurança total contra incidentes sofisticados, falhas de terceiros, comprometimento do dispositivo do usuário ou eventos fora do controle razoável da controladora.",
    ],
  },
  {
    id: "transferencia",
    title: "11. Transferência internacional",
    content: [
      "Alguns provedores utilizados para hospedagem, infraestrutura, pagamentos, monitoramento ou suporte técnico podem armazenar ou processar dados fora do Brasil, inclusive em jurisdições com legislação distinta.",
      "Quando houver transferência internacional, adotaremos as medidas compatíveis e razoáveis exigidas pela legislação aplicável para preservar a proteção dos dados e a legitimidade do tratamento, conforme a natureza da operação e o papel do terceiro envolvido.",
    ],
  },
  {
    id: "publico",
    title: "12. Público-alvo e limitações",
    content: [
      "O serviço é direcionado prioritariamente a uso profissional e empresarial. A plataforma não é estruturada como produto voltado especificamente ao público infantil.",
      "O usuário deve fornecer apenas dados necessários ao uso adequado do serviço e evitar inserir informações excessivas, sensíveis ou inadequadas para as finalidades operacionais da plataforma, salvo quando estritamente exigido por obrigação legal ou fluxo contratual específico.",
    ],
  },
  {
    id: "alteracoes",
    title: "13. Alterações desta Política",
    content: [
      "Esta Política poderá ser atualizada periodicamente para refletir mudanças legais, regulatórias, contratuais, operacionais ou tecnológicas.",
      "A versão vigente será a publicada nesta página, com indicação da data de última atualização. O uso continuado do serviço após mudanças relevantes poderá caracterizar ciência da nova versão, sem prejuízo de comunicações adicionais quando exigidas por lei ou consideradas adequadas pela controladora.",
    ],
  },
];

export const metadata: Metadata = {
  title: "Política de Privacidade | Pesquisa GTIN",
  description:
    "Conheça a Política de Privacidade do Pesquisa GTIN, incluindo LGPD, cookies, armazenamento local, cobrança e compartilhamento com terceiros.",
  alternates: {
    canonical: "https://pesquisagtin.com.br/politica-de-privacidade",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNavbar variant="simple" />

      <main className="pt-24 md:pt-28">
        <section className="border-b border-border/50 bg-primary/5 px-6 py-14 md:py-20">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-5">
              <Badge variant="secondary" className="rounded-full px-4 py-1">
                Documento LGPD e privacidade
              </Badge>
              <div className="space-y-4">
                <h1 className="text-3xl font-semibold tracking-tight text-primary md:text-5xl">
                  Política de Privacidade do Pesquisa GTIN
                </h1>
                <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
                  Esta Política explica quais dados tratamos, por que tratamos, com quem podemos
                  compartilhar e como o usuário pode exercer seus direitos.
                </p>
              </div>
            
            </div>

            <Card className="w-full max-w-xl border-border/70 shadow-sm">
              <CardHeader className="space-y-3">
                <CardTitle className="text-xl text-primary">Resumo prático</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                <p>
                  Tratamos dados de cadastro, autenticação, uso da plataforma, cobrança e
                  segurança para operar o Pesquisa GTIN de forma estável e contratualmente
                  adequada.
                </p>
                <p>
                  Usamos recursos técnicos como cookie funcional de interface e armazenamento local
                  para manter sessão autenticada no navegador.
                </p>
                <p>
                  Em planos pagos, dados de pagamento e assinatura são processados com apoio do
                  Stripe, respeitando a finalidade de cobrança e gestão contratual.
                </p>
                <p>
                  Solicitações sobre LGPD, direitos do titular e privacidade podem ser enviadas
                  para o e-mail jurídico informado nesta página.
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
                    <p className="text-lg font-semibold text-primary">Precisa falar sobre LGPD?</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Você pode entrar em contato para solicitar atendimento sobre direitos do
                      titular, privacidade, segurança, cobrança ou relação contratual.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button asChild className="rounded-full px-6">
                      <a href="mailto:contato@pesquisagtin.com.br?subject=Privacidade%20e%20LGPD">
                        Enviar solicitação
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="rounded-full px-6">
                      <Link href="/termos-de-uso">Ver Termos de Uso</Link>
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
