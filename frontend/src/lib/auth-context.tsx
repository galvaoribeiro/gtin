"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  getCurrentUser,
  isAuthenticated,
  clearAuthToken,
  type LoginCredentials,
  type RegisterData,
  type UserData,
  ApiError,
} from "./api";

interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Rotas que não precisam de autenticação
const publicRoutes = ["/login", "/register", "/", "/docs", "/pricing", "/sobre"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  
  // Refs para evitar chamadas duplicadas e race conditions
  const isCheckingAuth = useRef(false);
  const hasCheckedAuth = useRef(false);

  // Verificar autenticação ao carregar - APENAS UMA VEZ
  useEffect(() => {
    async function checkAuth() {
      // Evitar múltiplas chamadas simultâneas
      if (isCheckingAuth.current || hasCheckedAuth.current) {
        return;
      }
      
      isCheckingAuth.current = true;
      
      try {
        // Verificar se há token salvo
        if (isAuthenticated()) {
          try {
            const userData = await getCurrentUser();
            setUser(userData);
          } catch (err) {
            // Token inválido ou expirado - limpar token
            console.warn("Token inválido ou expirado:", err);
            clearAuthToken();
            setUser(null);
          }
        }
      } finally {
        isCheckingAuth.current = false;
        hasCheckedAuth.current = true;
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);

  // Redirecionar para login se não autenticado em rota protegida
  useEffect(() => {
    if (isLoading) return;

    const isPublicRoute = publicRoutes.some(
      (route) => pathname === route || pathname?.startsWith("/docs")
    );

    // Se não está em rota pública e não está logado, redireciona para login
    if (!isPublicRoute && !user) {
      router.push("/login");
    }

    // Se está na página de login ou registro e já está logado, redireciona para dashboard
    if ((pathname === "/login" || pathname === "/register") && user) {
      router.push("/dashboard");
    }
  }, [isLoading, user, pathname, router]);

  const login = async (credentials: LoginCredentials) => {
    setError(null);
    setIsLoading(true);

    try {
      await apiLogin(credentials);
      const userData = await getCurrentUser();
      setUser(userData);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail || err.message);
      } else {
        setError("Erro ao fazer login. Tente novamente.");
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setError(null);
    setIsLoading(true);

    try {
      await apiRegister(data);
      const userData = await getCurrentUser();
      setUser(userData);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail || err.message);
      } else {
        setError("Erro ao criar conta. Tente novamente.");
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    apiLogout();
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLoggedIn: !!user,
        login,
        register,
        logout,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

