"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function RegisterPage() {
  const { register, isLoading, error } = useAuth();
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!organizationName.trim()) {
      setLocalError("Digite o nome da sua empresa");
      return;
    }

    if (!email.trim()) {
      setLocalError("Digite seu email");
      return;
    }

    if (!password) {
      setLocalError("Digite sua senha");
      return;
    }

    if (password.length < 8) {
      setLocalError("A senha deve ter no mínimo 8 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("As senhas não coincidem");
      return;
    }

    try {
      await register({
        email,
        password,
        organization_name: organizationName,
      });
    } catch {
      // Erro já tratado no contexto
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50"></div>

      <Card className="w-full max-w-md relative bg-zinc-900/90 border-zinc-700 backdrop-blur-sm shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Criar Conta
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Registre-se para acessar a plataforma GTIN
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Erro */}
            {displayError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {displayError}
                </p>
              </div>
            )}

            {/* Nome da Empresa */}
            <div className="space-y-2">
              <label
                htmlFor="organizationName"
                className="text-sm font-medium text-zinc-300"
              >
                Nome da Empresa
              </label>
              <Input
                id="organizationName"
                type="text"
                placeholder="Minha Empresa Ltda"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                disabled={isLoading}
                autoComplete="organization"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-zinc-300"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-zinc-300"
              >
                Senha
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>

            {/* Confirmar Senha */}
            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-zinc-300"
              >
                Confirmar Senha
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Digite a senha novamente"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>

            {/* Botão de Registro */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-medium shadow-lg shadow-emerald-500/20 transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Criando conta...
                </span>
              ) : (
                "Criar Conta"
              )}
            </Button>
          </form>

          {/* Link para Login */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-zinc-400">
              Já tem uma conta?{" "}
              <Link
                href="/login"
                className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                Entrar
              </Link>
            </p>
            <Link
              href="/"
              className="text-sm text-zinc-500 hover:text-zinc-400 transition-colors inline-block"
            >
              ← Voltar para a página inicial
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

