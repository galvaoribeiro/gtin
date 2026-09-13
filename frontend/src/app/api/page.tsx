import type { Metadata } from "next";
import ApiPageClient from "./ApiPageClient";
import { JsonLd } from "@/components/landing-page/JsonLd";
import { API_FAQ } from "@/lib/marketing/constants";

export const metadata: Metadata = {
  title: "API GTIN e Código de Barras | API de Dados de Produtos",
  description:
    "API para consultar produtos pelo GTIN/EAN. Integre dados de produtos, NCM, CEST, marca e descrição ao seu ERP, PDV, e-commerce ou sistema.",
  keywords: [
    "API GTIN",
    "API EAN",
    "API código de barras",
    "API de produtos",
    "API NCM",
    "API CEST",
    "API para ERP",
    "API cadastro de produtos",
    "consulta GTIN API",
  ],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://pesquisagtin.com.br/api",
    siteName: "Pesquisa GTIN",
    title: "API GTIN e Código de Barras | API de Dados de Produtos",
    description:
      "API para consultar produtos pelo GTIN/EAN. Integre dados de produtos, NCM, CEST, marca e descrição ao seu ERP, PDV, e-commerce ou sistema.",
  },
  alternates: {
    canonical: "https://pesquisagtin.com.br/api",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: API_FAQ.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "API de Dados de Produtos por GTIN",
  provider: {
    "@type": "Organization",
    name: "Pesquisa GTIN",
    url: "https://pesquisagtin.com.br",
  },
  description:
    "API REST para consultar produtos pelo GTIN/EAN e integrar dados ao ERP, PDV, e-commerce ou aplicação.",
  url: "https://pesquisagtin.com.br/api",
};

export default function ApiPage() {
  return (
    <>
      <JsonLd data={faqJsonLd} />
      <JsonLd data={serviceJsonLd} />
      <ApiPageClient />
    </>
  );
}
