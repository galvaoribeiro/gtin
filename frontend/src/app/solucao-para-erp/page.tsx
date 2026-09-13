import type { Metadata } from "next";
import ErpPageClient from "./ErpPageClient";
import { JsonLd } from "@/components/landing-page/JsonLd";
import { ERP_FAQ } from "@/lib/marketing/constants";

export const metadata: Metadata = {
  title: "API para ERP: Cadastro e Enriquecimento de Produtos por GTIN",
  description:
    "Automatize o cadastro e enriquecimento de produtos no seu ERP usando uma API de dados por GTIN. Consulte descrição, marca, NCM, CEST e outros dados.",
  keywords: [
    "solução para ERP",
    "API para ERP",
    "API de produtos para ERP",
    "cadastro automático de produtos",
    "cadastro de produtos por GTIN",
    "importação de produtos por código de barras",
    "enriquecimento de catálogo",
    "API para cadastro de produtos",
    "API código de barras ERP",
    "API GTIN ERP",
  ],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://pesquisagtin.com.br/solucao-para-erp",
    siteName: "Pesquisa GTIN",
    title: "API para ERP: Cadastro e Enriquecimento de Produtos por GTIN",
    description:
      "Automatize o cadastro e enriquecimento de produtos no seu ERP usando uma API de dados por GTIN. Consulte descrição, marca, NCM, CEST e outros dados.",
  },
  alternates: {
    canonical: "https://pesquisagtin.com.br/solucao-para-erp",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: ERP_FAQ.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export default function ErpPage() {
  return (
    <>
      <JsonLd data={faqJsonLd} />
      <ErpPageClient />
    </>
  );
}
