// Mock de dados de produto GTIN
// Remover este arquivo ao integrar com backend real

export interface Product {
  gtin: string;
  gtin_type: string;
  brand: string;
  product_name: string;
  origin_country: string;
  ncm: string;
  ncm_formatted: string;
  cest: string[];
  gross_weight: {
    value: number;
    unit: string;
  };
}

export const mockProducts: Record<string, Product> = {
  "7898708460003": {
    gtin: "7898708460003",
    gtin_type: "13",
    brand: "ZEHN BIER",
    product_name: "CHOPP PORTER 1 LITRO",
    origin_country: "BR",
    ncm: "22030000",
    ncm_formatted: "2203.00.00",
    cest: ["0302300"],
    gross_weight: { value: 1130.0, unit: "GRM" },
  },
  "7891000100103": {
    gtin: "7891000100103",
    gtin_type: "13",
    brand: "NESCAFÉ",
    product_name: "CAFÉ SOLÚVEL TRADIÇÃO 200G",
    origin_country: "BR",
    ncm: "21011110",
    ncm_formatted: "2101.11.10",
    cest: ["1700600"],
    gross_weight: { value: 220.0, unit: "GRM" },
  },
  "7891910000197": {
    gtin: "7891910000197",
    gtin_type: "13",
    brand: "COCA-COLA",
    product_name: "REFRIGERANTE COCA-COLA 2L",
    origin_country: "BR",
    ncm: "22021000",
    ncm_formatted: "2202.10.00",
    cest: ["0300700"],
    gross_weight: { value: 2100.0, unit: "GRM" },
  },
};

// Função para simular busca de produto
export function findProduct(gtin: string): Product | null {
  return mockProducts[gtin] || null;
}

