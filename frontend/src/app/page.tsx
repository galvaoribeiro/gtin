import type { Metadata } from "next";
import LandingPageClient from "./LandingPageClient";

export const metadata: Metadata = {
  title: "Pesquisa GTIN – Consulta rápida de código de barras e dados fiscais",
  description:
    "Consulte GTIN, EAN, código de barras e informações fiscais (NCM, CEST) de produtos. API de alta performance com +30 milhões de produtos. Ideal para ERPs, e-commerces e contabilidades.",
  keywords: [
    "GTIN",
    "código de barras",
    "EAN",
    "NCM",
    "CEST",
    "consulta produto",
    "API GTIN",
    "dados fiscais",
    "reforma tributária",
    "validação NCM",
    "enriquecimento de catálogo",
  ],
  authors: [{ name: "Pesquisa GTIN" }],
  creator: "Pesquisa GTIN",
  publisher: "Pesquisa GTIN",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://pesquisagtin.com.br",
    siteName: "Pesquisa GTIN",
    title: "Pesquisa GTIN – Consulta rápida de código de barras e dados fiscais",
    description:
      "Consulte GTIN, EAN e informações fiscais (NCM, CEST) de +30 milhões de produtos. API de alta performance para ERPs, e-commerces e contabilidades.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Pesquisa GTIN - Consulta de código de barras",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pesquisa GTIN – Consulta rápida de código de barras",
    description:
      "Consulte GTIN, EAN e dados fiscais de +30 milhões de produtos. API para ERPs e e-commerces.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://pesquisagtin.com.br",
  },
  category: "technology",
};

export default function HomePage() {
  return <LandingPageClient />;
}
