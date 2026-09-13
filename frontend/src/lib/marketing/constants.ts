export const CONTACT_EMAIL = "contato@pesquisagtin.com.br";

export const DOCS_PAGE_PATH = "/docs";

export const API_DOCS_URL = `${
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
}/docs`;

export const EXAMPLE_GTIN = "7894900011517";

export const EXAMPLE_PRODUCT_JSON = `{
  "gtin": "7894900011517",
  "gtin_type": 13,
  "brand": "COCA-COLA",
  "product_name": "REFRIGERANTE COCA-COLA 350ML",
  "origin_country": "BR",
  "ncm": "22021000",
  "cest": ["03.007.00"],
  "gross_weight_value": 0.365,
  "gross_weight_unit": "GRM"
}`;

export type MarketingPlan = {
  id: string;
  name: string;
  priceLabel: string;
  usageLabel: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
  ctaHref: string;
  isEnterprise?: boolean;
};

export const MARKETING_PLANS: MarketingPlan[] = [
  {
    id: "basic",
    name: "Basic",
    priceLabel: "Grátis",
    usageLabel: "Para pequenos volumes e primeiros testes de integração.",
    features: [
      "5 consultas/mês",
      "1 API Key",
      "Consulta individual via API",
      "10 req/min",
    ],
    cta: "Começar gratuitamente",
    ctaHref: "/register",
  },
  {
    id: "starter",
    name: "Starter",
    priceLabel: "R$ 199,90/mês",
    usageLabel: "Para pequenos volumes e primeiros testes de integração.",
    features: [
      "5.000 consultas/mês",
      "Batch até 5 GTINs/requisição",
      "1 API Key",
      "60 req/min",
    ],
    cta: "Começar gratuitamente",
    ctaHref: "/register",
  },
  {
    id: "pro",
    name: "Pro",
    priceLabel: "R$ 399,90/mês",
    usageLabel: "Para sistemas com maior volume de consultas.",
    features: [
      "20.000 consultas/mês",
      "Batch até 10 GTINs/requisição",
      "Até 10 API Keys",
      "90 req/min",
    ],
    highlighted: true,
    cta: "Começar gratuitamente",
    ctaHref: "/register",
  },
  {
    id: "advanced",
    name: "Advanced",
    priceLabel: "R$ 799,90/mês",
    usageLabel: "Indicado para ERPs e plataformas com maior volume de consultas.",
    features: [
      "100.000 consultas/mês",
      "Batch até 20 GTINs/requisição",
      "Até 50 API Keys",
      "120 req/min",
    ],
    cta: "Começar gratuitamente",
    ctaHref: "/register",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceLabel: "Sob consulta",
    usageLabel:
      "Para operações que precisam de limites personalizados, maior volume e necessidades específicas.",
    features: [
      "Limites personalizados",
      "Batch até 100 GTINs/requisição",
      "Condições comerciais negociadas",
    ],
    isEnterprise: true,
    cta: "Falar com nossa equipe",
    ctaHref: `mailto:${CONTACT_EMAIL}?subject=Plano%20Enterprise%20Pesquisa%20GTIN`,
  },
];

export type FaqItem = {
  question: string;
  answer: string;
};

export const API_FAQ: FaqItem[] = [
  {
    question: "O que é a API de GTIN?",
    answer:
      "É uma API REST que recebe um código GTIN/EAN e retorna dados estruturados do produto — como descrição, marca, NCM, CEST, país de origem e peso bruto, conforme disponibilidade na base.",
  },
  {
    question: "Quais dados a API retorna?",
    answer:
      "gtin, gtin_type, brand, product_name, origin_country, ncm, cest (lista), gross_weight_value e gross_weight_unit. Campos podem retornar vazios dependendo da disponibilidade na base.",
  },
  {
    question: "Posso consultar vários GTINs em lote?",
    answer:
      "Sim. Use POST /v1/gtins/batch com uma lista de GTINs em JSON. O limite por requisição depende do plano (Starter: 5, Pro: 10, Advanced: 20, Enterprise: até 100). O plano Basic não inclui batch.",
  },
  {
    question: "Posso integrar ao meu ERP?",
    answer:
      "Sim. A API foi pensada para integração em ERPs, PDVs, e-commerce e aplicações próprias via REST + JSON, com autenticação por API Key.",
  },
  {
    question: "Posso utilizar durante o cadastro de produtos?",
    answer:
      "Sim. Quando o operador informa ou escaneia um GTIN, seu sistema pode chamar GET /v1/gtins/{gtin} e preencher automaticamente os campos do cadastro.",
  },
  {
    question: "Posso utilizar para importar uma base de produtos?",
    answer:
      "Sim. Para integração automatizada, seu sistema pode iterar GTINs via API (batch ou consultas individuais). Para volumes muito grandes de uma só vez, também oferecemos o serviço Bulk em /bulk, com processamento assistido.",
  },
  {
    question: "Como funciona a autenticação?",
    answer:
      "Use X-API-Key: sk_live_... ou Authorization: Bearer sk_live_.... A chave é gerada no painel em /api-keys após criar sua conta.",
  },
  {
    question: "Existe ambiente de testes?",
    answer:
      "O plano Basic (grátis) permite testar a integração real com 5 consultas/mês e 1 API Key. Crie sua conta, gere a chave e faça chamadas contra os mesmos endpoints de produção.",
  },
  {
    question: "Existe limite de consultas?",
    answer:
      "Sim. Cada plano tem limite mensal (Basic: 5, Starter: 5.000, Pro: 20.000, Advanced: 100.000) e rate limit por minuto. Ao exceder, a API retorna HTTP 429.",
  },
  {
    question: "A API retorna NCM?",
    answer:
      "Sim, quando disponível na base. O campo ncm retorna o código de 8 dígitos.",
  },
  {
    question: "A API retorna CEST?",
    answer:
      "Sim, quando disponível. O campo cest retorna uma lista de códigos CEST associados ao produto.",
  },
  {
    question: "Como começo a integração?",
    answer:
      "Crie uma conta gratuita, gere sua API Key em /api-keys, consulte a documentação em /docs e faça sua primeira requisição GET /v1/gtins/{gtin}.",
  },
];

export const ERP_FAQ: FaqItem[] = [
  {
    question: "Posso integrar o Pesquisa GTIN ao meu ERP?",
    answer:
      "Sim. A integração é feita via API REST com autenticação por API Key. Seu ERP envia o GTIN e recebe os dados estruturados para preencher ou enriquecer cadastros.",
  },
  {
    question: "Posso consultar produtos durante o cadastro?",
    answer:
      "Sim. Esse é um dos principais casos de uso: o usuário informa ou escaneia o GTIN e seu sistema consulta a API para preencher descrição, marca, NCM, CEST e demais campos disponíveis.",
  },
  {
    question: "Posso importar milhares de GTINs?",
    answer:
      "Sim. Para integração contínua, seu sistema pode processar GTINs via API (batch ou consultas individuais em loop). Para volumes muito grandes de uma só vez, oferecemos o serviço Bulk (/bulk) com processamento assistido.",
  },
  {
    question: "Posso usar a API em um PDV?",
    answer:
      "Sim. PDVs podem consultar a API no momento do cadastro ou conferência de produtos, usando o GTIN escaneado ou digitado.",
  },
  {
    question: "Posso usar a API em um e-commerce?",
    answer:
      "Sim. Plataformas de e-commerce podem enriquecer catálogos e cadastros de produtos a partir do GTIN, integrando a API ao fluxo de cadastro ou importação.",
  },
  {
    question: "Quais dados estão disponíveis?",
    answer:
      "Descrição (product_name), marca, NCM, CEST, país de origem, peso bruto e tipo de GTIN — conforme disponibilidade na base para cada código consultado.",
  },
  {
    question: "Como funciona o limite de consultas?",
    answer:
      "Cada plano define um limite mensal de consultas e um rate limit por minuto. Picos de uso em dias específicos (como importações) consomem a cota mensal da organização.",
  },
  {
    question: "Existe ambiente gratuito?",
    answer:
      "Sim. O plano Basic oferece 5 consultas/mês com API Key real, ideal para validar a integração antes de assinar um plano pago.",
  },
  {
    question: "Como funciona a integração?",
    answer:
      "REST + JSON. Gere uma API Key no painel, configure o header de autenticação no seu sistema e chame GET /v1/gtins/{gtin} ou POST /v1/gtins/batch conforme o caso de uso.",
  },
  {
    question: "Posso negociar um volume maior?",
    answer:
      "Sim. Para volumes acima dos planos padrão ou necessidades específicas, entre em contato para condições Enterprise personalizadas.",
  },
];

export const CODE_SNIPPETS = {
  curl: `curl -H "Authorization: Bearer sk_live_SUA_CHAVE" \\
  https://api.pesquisagtin.com.br/v1/gtins/7894900011517`,
  javascript: `const response = await fetch(
  "https://api.pesquisagtin.com.br/v1/gtins/7894900011517",
  {
    headers: {
      Authorization: "Bearer sk_live_SUA_CHAVE",
    },
  }
);

const product = await response.json();
console.log(product.product_name, product.ncm);`,
  python: `import requests

response = requests.get(
    "https://api.pesquisagtin.com.br/v1/gtins/7894900011517",
    headers={"Authorization": "Bearer sk_live_SUA_CHAVE"},
    timeout=30,
)
response.raise_for_status()
product = response.json()
print(product["product_name"], product["ncm"])`,
  batch: `curl -X POST https://api.pesquisagtin.com.br/v1/gtins/batch \\
  -H "Authorization: Bearer sk_live_SUA_CHAVE" \\
  -H "Content-Type: application/json" \\
  -d '{"gtins": ["7894900011517", "7891000100103"]}'`,
};
