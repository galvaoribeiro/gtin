/**
 * API Helper para comunicação com o backend FastAPI
 * ===================================================
 */

// URL base da API (definida em .env.local)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// =============================================================================
// Auth Token Management
// =============================================================================

let authToken: string | null = null;

/**
 * Define o token de autenticação JWT
 */
export function setAuthToken(token: string | null): void {
  authToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("auth_token", token);
    } else {
      localStorage.removeItem("auth_token");
    }
  }
}

/**
 * Obtém o token de autenticação
 */
export function getAuthToken(): string | null {
  if (authToken) return authToken;
  
  if (typeof window !== "undefined") {
    authToken = localStorage.getItem("auth_token");
  }
  return authToken;
}

/**
 * Limpa o token de autenticação (logout)
 */
export function clearAuthToken(): void {
  authToken = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token");
  }
}

/**
 * Verifica se o usuário está autenticado
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

/**
 * Retorna os headers de autenticação JWT para o dashboard
 */
function getJwtAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {
    "Accept": "application/json",
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return headers;
}

// =============================================================================
// Auth Endpoints
// =============================================================================

/**
 * Interface para credenciais de login
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Interface para dados de registro
 */
export interface RegisterData {
  email: string;
  password: string;
  organization_name: string;
}

/**
 * Interface para resposta de token
 */
export interface TokenResponse {
  access_token: string;
  token_type: string;
}

/**
 * Interface para dados do usuário
 */
export interface UserData {
  id: number;
  email: string;
  organization_id: number;
  organization_name: string | null;
  plan: string | null;
  monthly_limit?: number | null;
  is_active: boolean;
  created_at: string;
}

/**
 * Faz login e retorna o token JWT
 */
export async function login(credentials: LoginCredentials): Promise<TokenResponse> {
  const url = `${API_BASE_URL}/v1/auth/login`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
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
        detail || "Email ou senha incorretos",
        response.status,
        detail
      );
    }
    
    const data: TokenResponse = await response.json();
    
    // Salvar token automaticamente
    setAuthToken(data.access_token);
    
    return data;
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

/**
 * Registra um novo usuário e organização
 */
export async function register(data: RegisterData): Promise<TokenResponse> {
  const url = `${API_BASE_URL}/v1/auth/register`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
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
        detail || "Erro ao criar conta",
        response.status,
        detail
      );
    }
    
    const tokenData: TokenResponse = await response.json();
    
    // Salvar token automaticamente (login automático)
    setAuthToken(tokenData.access_token);
    
    return tokenData;
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

/**
 * Obtém os dados do usuário autenticado
 */
export async function getCurrentUser(): Promise<UserData> {
  const url = `${API_BASE_URL}/v1/auth/me`;
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: getJwtAuthHeaders(),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        clearAuthToken();
        throw new ApiError("Sessão expirada", 401);
      }
      
      let detail: string | undefined;
      try {
        const errorBody = await response.json();
        detail = errorBody.detail;
      } catch {
        // Ignora erro ao parsear resposta
      }
      
      throw new ApiError(
        `Erro ao obter dados do usuário: ${response.status}`,
        response.status,
        detail
      );
    }
    
    return await response.json();
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

/**
 * Atualiza dados do usuário/organização
 */
export interface UpdateUserPayload {
  email?: string;
  organization_name?: string;
}

export async function updateCurrentUser(payload: UpdateUserPayload): Promise<UserData> {
  const url = `${API_BASE_URL}/v1/auth/me`;

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        ...getJwtAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthToken();
        throw new ApiError("Sessão expirada", 401);
      }

      let detail: string | undefined;
      try {
        const errorBody = await response.json();
        detail = errorBody.detail;
      } catch {
        // Ignora erro ao parsear resposta
      }

      throw new ApiError(
        detail || `Erro ao atualizar usuário: ${response.status}`,
        response.status,
        detail
      );
    }

    return await response.json();
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

/**
 * Faz logout limpando o token
 */
export function logout(): void {
  clearAuthToken();
}

// =============================================================================
// Product/GTIN Types and Helpers
// =============================================================================

/**
 * Interface do produto retornado pela API
 */
export interface ApiProduct {
  gtin: string;
  gtin_type: number | null;
  brand: string | null;
  product_name: string | null;
  origin_country: string | null;
  ncm: string | null;
  cest: string[] | null;
  gross_weight_value: number | null;
  gross_weight_unit: string | null;
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
  origin_country: string;
  ncm: string;
  ncm_formatted: string;
  cest: string[];
  gross_weight: {
    value: number;
    unit: string;
  };
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
  // Garantir que cest seja sempre um array
  let cestArray: string[] = [];
  if (apiProduct.cest) {
    if (Array.isArray(apiProduct.cest)) {
      cestArray = apiProduct.cest;
    } else if (typeof apiProduct.cest === 'string') {
      // Se vier como string, tentar parsear
      cestArray = [apiProduct.cest];
    }
  }
  
  return {
    gtin: apiProduct.gtin,
    gtin_type: apiProduct.gtin_type?.toString() || "13",
    brand: apiProduct.brand || "",
    product_name: apiProduct.product_name || "",
    origin_country: apiProduct.origin_country || "",
    ncm: apiProduct.ncm || "",
    ncm_formatted: formatNcm(apiProduct.ncm),
    cest: cestArray,
    gross_weight: {
      value: apiProduct.gross_weight_value || 0,
      unit: apiProduct.gross_weight_unit || "GRM",
    },
    image_url: apiProduct.image_url,
  };
}

// =============================================================================
// Dashboard GTIN Endpoint (usa JWT)
// =============================================================================

/**
 * Consulta um produto pelo GTIN via dashboard (usa JWT)
 * 
 * @param gtin - Código GTIN do produto
 * @returns Produto encontrado
 * @throws ApiError se o produto não for encontrado ou houver erro
 */
export async function fetchGtinDashboard(gtin: string): Promise<Product> {
  const url = `${API_BASE_URL}/v1/dashboard/gtins/${encodeURIComponent(gtin)}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: getJwtAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthToken();
        throw new ApiError("Sessão expirada", 401);
      }
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

// Alias para compatibilidade - agora usa endpoint de dashboard
export const fetchGtin = fetchGtinDashboard;

// =============================================================================
// Public GTIN Endpoint (sem autenticação)
// =============================================================================

/**
 * Consulta pública de produto por GTIN (sem autenticação).
 * 
 * Endpoint público para consultas gratuitas na landing page.
 * Rate limit: 30 requisições por minuto por IP.
 * 
 * @param gtin - Código GTIN do produto
 * @returns Produto encontrado
 * @throws ApiError se o produto não for encontrado ou houver erro
 */
export async function fetchGtinPublic(gtin: string): Promise<Product> {
  const url = `${API_BASE_URL}/v1/public/gtins/${encodeURIComponent(gtin)}`;

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
      if (response.status === 400) {
        throw new ApiError("GTIN inválido", 400);
      }
      if (response.status === 429) {
        let detail: string | undefined;
        try {
          const errorBody = await response.json();
          detail = errorBody.detail;
        } catch {
          // ignora erro ao parsear
        }
        throw new ApiError(
          detail || "Limite de requisições excedido. Tente novamente em alguns instantes.",
          429,
          detail
        );
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
        detail || `Erro ao consultar API: ${response.status}`,
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

// =============================================================================
// Dashboard API Keys (usa JWT)
// =============================================================================

/**
 * Interface de API Key retornada pelo backend
 */
export interface DashboardApiKey {
  id: number;
  name: string | null;
  masked_key: string;
  status: "active" | "revoked";
  created_at: string;
  last_used_at: string | null;
}

/**
 * Interface de API Key criada (com key completa)
 */
export interface DashboardApiKeyCreated extends DashboardApiKey {
  key: string; // Key completa - mostrada apenas uma vez!
}

export interface DashboardApiKeysPage {
  items: DashboardApiKey[];
  page: number;
  per_page: number;
  total: number;
  active_count: number;
  active_limit: number;
}

/**
 * Lista todas as API keys do dashboard
 * 
 * @returns Lista de API keys
 */
export async function getDashboardApiKeys(params?: {
  page?: number;
  per_page?: number;
}): Promise<DashboardApiKeysPage> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.per_page) searchParams.set("per_page", String(params.per_page));

  const query = searchParams.toString();
  const url = `${API_BASE_URL}/v1/dashboard/api-keys${query ? `?${query}` : ""}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: getJwtAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthToken();
        throw new ApiError("Sessão expirada", 401);
      }
      
      let detail: string | undefined;
      try {
        const errorBody = await response.json();
        detail = errorBody.detail;
      } catch {
        // Ignora erro ao parsear resposta
      }

      throw new ApiError(
        `Erro ao buscar API keys: ${response.status}`,
        response.status,
        detail
      );
    }

    return await response.json();
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

/**
 * Cria uma nova API key
 * 
 * @param name - Nome opcional para a chave
 * @returns API key criada com a key completa
 */
export async function createDashboardApiKey(name?: string): Promise<DashboardApiKeyCreated> {
  const url = `${API_BASE_URL}/v1/dashboard/api-keys`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...getJwtAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: name || "Nova chave" }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthToken();
        throw new ApiError("Sessão expirada", 401);
      }
      
      let detail: string | undefined;
      try {
        const errorBody = await response.json();
        detail = errorBody.detail;
      } catch {
        // Ignora erro ao parsear resposta
      }

      throw new ApiError(
        `Erro ao criar API key: ${response.status}`,
        response.status,
        detail
      );
    }

    return await response.json();
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

/**
 * Revoga uma API key
 * 
 * @param id - ID da API key a ser revogada
 * @returns API key atualizada
 */
export async function revokeDashboardApiKey(id: number): Promise<DashboardApiKey> {
  const url = `${API_BASE_URL}/v1/dashboard/api-keys/${id}/revoke`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: getJwtAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthToken();
        throw new ApiError("Sessão expirada", 401);
      }
      
      let detail: string | undefined;
      try {
        const errorBody = await response.json();
        detail = errorBody.detail;
      } catch {
        // Ignora erro ao parsear resposta
      }

      throw new ApiError(
        `Erro ao revogar API key: ${response.status}`,
        response.status,
        detail
      );
    }

    return await response.json();
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

// =============================================================================
// Métricas de Uso (usa JWT)
// =============================================================================

/**
 * Interface para uso diário
 */
export interface DailyUsage {
  date: string;
  success_count: number;
  error_count: number;
  total_count: number;
}

/**
 * Interface para resumo de uso por API key
 */
export interface ApiKeyUsageSummary {
  api_key_id: number;
  api_key_name: string | null;
  total_success: number;
  total_error: number;
  total_calls: number;
}

/**
 * Interface para resposta de resumo de uso
 */
export interface UsageSummaryResponse {
  period_days: number;
  start_date: string;
  end_date: string;
  total_success: number;
  total_error: number;
  total_calls: number;
  by_api_key: ApiKeyUsageSummary[];
}

/**
 * Interface para resposta de série diária
 */
export interface DailySeriesResponse {
  start_date: string;
  end_date: string;
  total_days: number;
  series: DailyUsage[];
}

/**
 * Interface para série diária de uma API key
 */
export interface ApiKeyDailySeriesResponse {
  api_key_id: number;
  api_key_name: string | null;
  start_date: string;
  end_date: string;
  total_days: number;
  total_success: number;
  total_error: number;
  series: DailyUsage[];
}

/**
 * Obtém resumo de uso agregado
 * 
 * @param days - Número de dias para o período (padrão: 7)
 * @returns Resumo de uso agregado
 */
export async function getUsageSummary(days: number = 7): Promise<UsageSummaryResponse> {
  const url = `${API_BASE_URL}/v1/metrics/summary?days=${days}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: getJwtAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthToken();
        throw new ApiError("Sessão expirada", 401);
      }
      
      let detail: string | undefined;
      try {
        const errorBody = await response.json();
        detail = errorBody.detail;
      } catch {
        // Ignora erro ao parsear resposta
      }

      throw new ApiError(
        `Erro ao buscar resumo de uso: ${response.status}`,
        response.status,
        detail
      );
    }

    return await response.json();
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

/**
 * Obtém série diária de uso agregado
 * 
 * @param startDate - Data inicial (opcional)
 * @param endDate - Data final (opcional)
 * @returns Série diária de uso
 */
export async function getUsageDaily(startDate?: string, endDate?: string): Promise<DailySeriesResponse> {
  let url = `${API_BASE_URL}/v1/metrics/daily`;
  const params = new URLSearchParams();
  
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: getJwtAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthToken();
        throw new ApiError("Sessão expirada", 401);
      }
      
      let detail: string | undefined;
      try {
        const errorBody = await response.json();
        detail = errorBody.detail;
      } catch {
        // Ignora erro ao parsear resposta
      }

      throw new ApiError(
        `Erro ao buscar série diária: ${response.status}`,
        response.status,
        detail
      );
    }

    return await response.json();
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

/**
 * Obtém série diária de uso de uma API key específica
 * 
 * @param apiKeyId - ID da API key
 * @param startDate - Data inicial (opcional)
 * @param endDate - Data final (opcional)
 * @returns Série diária de uso da API key
 */
export async function getUsageByApiKey(
  apiKeyId: number,
  startDate?: string,
  endDate?: string
): Promise<ApiKeyDailySeriesResponse> {
  let url = `${API_BASE_URL}/v1/metrics/api-keys/${apiKeyId}`;
  const params = new URLSearchParams();
  
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: getJwtAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthToken();
        throw new ApiError("Sessão expirada", 401);
      }
      
      if (response.status === 404) {
        throw new ApiError("API key não encontrada", 404);
      }
      
      let detail: string | undefined;
      try {
        const errorBody = await response.json();
        detail = errorBody.detail;
      } catch {
        // Ignora erro ao parsear resposta
      }

      throw new ApiError(
        `Erro ao buscar uso da API key: ${response.status}`,
        response.status,
        detail
      );
    }

    return await response.json();
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

// =============================================================================
// Billing & Subscription (usa JWT)
// =============================================================================

/**
 * Interface para dados da subscription
 */
export interface SubscriptionData {
  plan: string;
  status: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  monthly_limit: number;
}

/**
 * Interface para invoice
 */
export interface InvoiceData {
  id: string;
  date: string;
  amount: number;
  status: string;
  invoice_pdf: string | null;
}

/**
 * Interface para método de pagamento
 */
export interface PaymentMethodData {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

/**
 * Interface para dados completos de billing
 */
export interface BillingData {
  subscription: SubscriptionData;
  invoices: InvoiceData[];
  payment_methods: PaymentMethodData[];
}

/**
 * Obtém dados de billing (subscription, invoices, payment methods)
 */
export async function getBillingData(): Promise<BillingData> {
  const url = `${API_BASE_URL}/api/v1/billing/data`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: getJwtAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthToken();
        throw new ApiError("Sessão expirada", 401);
      }
      
      let detail: string | undefined;
      try {
        const errorBody = await response.json();
        detail = errorBody.detail;
      } catch {
        // Ignora erro ao parsear resposta
      }

      throw new ApiError(
        `Erro ao buscar dados de billing: ${response.status}`,
        response.status,
        detail
      );
    }

    return await response.json();
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

/**
 * Interface para resposta de checkout session
 */
export interface CheckoutSessionResponse {
  url: string;
  session_id: string;
}

/**
 * Cria uma sessão de checkout do Stripe
 * 
 * @param plan - Plano desejado (starter, pro, advanced)
 * @returns URL do checkout e session ID
 */
export async function createCheckoutSession(plan: string): Promise<CheckoutSessionResponse> {
  const url = `${API_BASE_URL}/api/v1/billing/checkout-session`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...getJwtAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ plan }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthToken();
        throw new ApiError("Sessão expirada", 401);
      }
      
      let detail: string | undefined;
      try {
        const errorBody = await response.json();
        detail = errorBody.detail;
      } catch {
        // Ignora erro ao parsear resposta
      }

      throw new ApiError(
        detail || `Erro ao criar sessão de checkout: ${response.status}`,
        response.status,
        detail
      );
    }

    return await response.json();
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

/**
 * Interface para resposta de portal de billing
 */
export interface BillingPortalResponse {
  url: string;
}

/**
 * Cria uma sessão do portal de billing do Stripe
 * 
 * @returns URL do portal de billing
 */
export async function createBillingPortalSession(): Promise<BillingPortalResponse> {
  const url = `${API_BASE_URL}/api/v1/billing/customer-portal`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: getJwtAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthToken();
        throw new ApiError("Sessão expirada", 401);
      }
      
      let detail: string | undefined;
      try {
        const errorBody = await response.json();
        detail = errorBody.detail;
      } catch {
        // Ignora erro ao parsear resposta
      }

      throw new ApiError(
        detail || `Erro ao criar portal de billing: ${response.status}`,
        response.status,
        detail
      );
    }

    return await response.json();
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
