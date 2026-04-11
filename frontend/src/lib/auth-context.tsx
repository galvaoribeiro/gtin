"use client";

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  getCurrentUser,
  isAuthenticated,
  clearAuthToken,
  setAuthToken,
  getAuthToken,
  type LoginCredentials,
  type RegisterData,
  type UserData,
  ApiError,
} from "./api";

const IMPERSONATION_KEY = "admin_original_token";

interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  isImpersonating: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  startImpersonation: (token: string) => Promise<void>;
  stopImpersonation: () => Promise<void>;
  refreshUser: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicRoutes = ["/login", "/register", "/", "/docs", "/pricing", "/sobre", "/bulk", "/termos-de-uso", "/politica-de-privacidade"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const isCheckingAuth = useRef(false);
  const hasCheckedAuth = useRef(false);

  const isImpersonating =
    typeof window !== "undefined" && !!localStorage.getItem(IMPERSONATION_KEY);

  useEffect(() => {
    async function checkAuth() {
      if (isCheckingAuth.current || hasCheckedAuth.current) return;
      isCheckingAuth.current = true;
      try {
        if (isAuthenticated()) {
          try {
            const userData = await getCurrentUser();
            setUser(userData);
          } catch {
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

  useEffect(() => {
    if (isLoading) return;
    const isPublicRoute = publicRoutes.some(
      (route) => pathname === route || pathname?.startsWith("/docs")
    );
    if (!isPublicRoute && !user) {
      router.push("/login");
    }
    if ((pathname === "/login" || pathname === "/register") && user) {
      router.push("/dashboard");
    }
  }, [isLoading, user, pathname, router]);

  const refreshUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch {
      clearAuthToken();
      setUser(null);
    }
  };

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
    if (typeof window !== "undefined") {
      localStorage.removeItem(IMPERSONATION_KEY);
    }
    apiLogout();
    setUser(null);
    router.push("/login");
  };

  const startImpersonation = async (newToken: string) => {
    const currentToken = getAuthToken();
    if (currentToken && typeof window !== "undefined") {
      localStorage.setItem(IMPERSONATION_KEY, currentToken);
    }
    setAuthToken(newToken);
    const userData = await getCurrentUser();
    setUser(userData);
    router.push("/dashboard");
  };

  const stopImpersonation = async () => {
    if (typeof window === "undefined") return;
    const originalToken = localStorage.getItem(IMPERSONATION_KEY);
    localStorage.removeItem(IMPERSONATION_KEY);
    if (originalToken) {
      setAuthToken(originalToken);
      const userData = await getCurrentUser();
      setUser(userData);
      router.push("/admin/users");
    } else {
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLoggedIn: !!user,
        isImpersonating,
        login,
        register,
        logout,
        startImpersonation,
        stopImpersonation,
        refreshUser,
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
