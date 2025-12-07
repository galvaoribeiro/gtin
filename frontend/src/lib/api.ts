/**
 * API Helper para comunicação com o backend FastAPI
 * ===================================================
 */

// URL base da API (definida em .env.local)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

/**
 * Interface do produto retornado pela API
 */
export interface ApiProduct {
  gtin: string;
  gtin_type: number | null;
  brand: string | null;
  product_name: string | null;
  owner_tax_id: string | null;
  origin_country: string | null;
  ncm: string | null;
  cest: string[] | null;
  gross_weight_value: number | null;
  gross_weight_unit: string | null;
  dsit_date: string | null;
  updated_at: string | null;
  image_url: string | null;
}

/**
 * Interface do produto formatado para o frontend
 * (compatível com a estrutura usada nos componentes)
 */
export interface Product {
  gtin: string;
  gtin_type: string;
  brand: string;
  product_name: string;
  owner_tax_id: string;
  origin_country: string;
  ncm: string;
  ncm_formatted: string;
  cest: string[];
  gross_weight: {
    value: number;
    unit: string;
  };
  dsit_timestamp: string;
  updated_at: string;
  image_url: string | null;
}

/**
 * Classe de erro para API
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Formata o código NCM para o padrão XXXX.XX.XX
 */
function formatNcm(ncm: string | null): string {
  if (!ncm) return "";
  // Remove caracteres não numéricos
  const digits = ncm.replace(/\D/g, "");
  if (digits.length !== 8) return ncm;
  // Formata: XXXX.XX.XX
  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}`;
}

/**
 * Transforma o produto da API para o formato do frontend
 */
function transformProduct(apiProduct: ApiProduct): Product {
  return {
    gtin: apiProduct.gtin,
    gtin_type: apiProduct.gtin_type?.toString() || "13",
    brand: apiProduct.brand || "",
    product_name: apiProduct.product_name || "",
    owner_tax_id: apiProduct.owner_tax_id || "",
    origin_country: apiProduct.origin_country || "",
    ncm: apiProduct.ncm || "",
    ncm_formatted: formatNcm(apiProduct.ncm),
    cest: apiProduct.cest || [],
    gross_weight: {
      value: apiProduct.gross_weight_value || 0,
      unit: apiProduct.gross_weight_unit || "GRM",
    },
    dsit_timestamp: apiProduct.dsit_date || "",
    updated_at: apiProduct.updated_at || "",
    image_url: apiProduct.image_url,
  };
}

/**
 * Consulta um produto pelo GTIN
 * 
 * @param gtin - Código GTIN do produto
 * @returns Produto encontrado
 * @throws ApiError se o produto não for encontrado ou houver erro
 */
export async function fetchGtin(gtin: string): Promise<Product> {
  const url = `${API_BASE_URL}/v1/gtins/${encodeURIComponent(gtin)}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new ApiError("GTIN não encontrado", 404);
      }
      
      // Tenta extrair detalhes do erro
      let detail: string | undefined;
      try {
        const errorBody = await response.json();
        detail = errorBody.detail;
      } catch {
        // Ignora erro ao parsear resposta
      }

      throw new ApiError(
        `Erro ao consultar API: ${response.status}`,
        response.status,
        detail
      );
    }

    const apiProduct: ApiProduct = await response.json();
    return transformProduct(apiProduct);
  } catch (error) {
    // Re-lança ApiError como está
    if (error instanceof ApiError) {
      throw error;
    }

    // Erro de rede ou outro erro
    throw new ApiError(
      "Erro de conexão com o servidor",
      0,
      error instanceof Error ? error.message : "Erro desconhecido"
    );
  }
}

/**
 * Verifica a saúde da API
 * 
 * @returns true se a API está saudável
 */
export async function fetchHealth(): Promise<boolean> {
  const url = `${API_BASE_URL}/health`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Interface para resposta de batch
 */
export interface BatchResult {
  gtin: string;
  found: boolean;
  product: Product | null;
}

export interface BatchResponse {
  total_requested: number;
  total_found: number;
  results: BatchResult[];
}

/**
 * Consulta múltiplos GTINs em lote
 * 
 * @param gtins - Lista de GTINs para consultar
 * @returns Resultado da consulta em lote
 */
export async function fetchGtinsBatch(gtins: string[]): Promise<BatchResponse> {
  const url = `${API_BASE_URL}/v1/gtins:batch`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ gtins }),
    });

    if (!response.ok) {
      let detail: string | undefined;
      try {
        const errorBody = await response.json();
        detail = errorBody.detail;
      } catch {
        // Ignora erro ao parsear resposta
      }

      throw new ApiError(
        `Erro ao consultar API: ${response.status}`,
        response.status,
        detail
      );
    }

    const data = await response.json();
    
    // Transforma os produtos encontrados
    return {
      total_requested: data.total_requested,
      total_found: data.total_found,
      results: data.results.map((item: { gtin: string; found: boolean; product: ApiProduct | null }) => ({
        gtin: item.gtin,
        found: item.found,
        product: item.product ? transformProduct(item.product) : null,
      })),
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      "Erro de conexão com o servidor",
      0,
      error instanceof Error ? error.message : "Erro desconhecido"
    );
  }
}

