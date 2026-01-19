import { QueryClient, QueryFunction, QueryCache, MutationCache } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Função para lidar com erros globalmente (O "Porteiro")
function handleGlobalError(error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Se o erro contém "401", força o logout
  if (errorMessage.includes("401") || errorMessage.toLowerCase().includes("unauthorized")) {
    if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
      // Opcional: Limpar token do localStorage se você usar
      localStorage.removeItem("auth_token"); 
      
      // Redirecionamento total para forçar a saída do loop
      window.location.href = "/auth/login";
    }
  }
}

export const queryClient = new QueryClient({
  // 1. Captura erros em Queries (GET)
  queryCache: new QueryCache({
    onError: handleGlobalError,
  }),
  // 2. Captura erros em Mutations (POST, PUT, DELETE)
  mutationCache: new MutationCache({
    onError: handleGlobalError,
  }),
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Agora é seguro deixar true, pois o erro 401 redireciona
      staleTime: Infinity,
      // Lógica inteligente de repetição
      retry: (failureCount, error) => {
        const msg = error instanceof Error ? error.message : String(error);
        // Se for 401, NÃO tenta de novo (retorna false)
        if (msg.includes("401")) return false;
        
        // Se for outro erro (ex: 500), tenta até 2 vezes
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});