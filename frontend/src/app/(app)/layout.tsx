"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

const sidebarLinks = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/gtins", label: "GTINs", icon: "🔍" },
  { href: "/api-keys", label: "API Keys", icon: "🔑" },
  { href: "/usage", label: "Uso", icon: "📈" },
  { href: "/billing", label: "Cobrança", icon: "💳" },
  { href: "/settings", label: "Configurações", icon: "⚙️" },
];

const adminLinks = [
  { href: "/admin/users", label: "Usuários", icon: "👥" },
  { href: "/admin/organizations", label: "Organizações", icon: "🏢" },
];

function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-60 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 flex flex-col">
      <div className="flex h-16 items-center border-b border-zinc-200 px-6 dark:border-zinc-800">
        <Link href="/" className="text-xl font-bold text-zinc-900 dark:text-white">
          GTIN Platform
        </Link>
      </div>
      <nav className="flex flex-col gap-1 p-4 flex-1 overflow-y-auto">
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-white"
              )}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="mt-4 mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Admin
            </div>
            {adminLinks.map((link) => {
              const isActive = pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-white"
                  )}
                >
                  <span>{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
        <Button
          variant="ghost"
          className="w-full justify-start text-zinc-600 hover:text-red-600 hover:bg-red-50 dark:text-zinc-400 dark:hover:text-red-400 dark:hover:bg-red-950/50"
          onClick={logout}
        >
          <svg
            className="w-4 h-4 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Sair
        </Button>
      </div>
    </aside>
  );
}

function ImpersonationBanner() {
  const { user, stopImpersonation, isImpersonating } = useAuth();
  if (!isImpersonating || !user?.impersonated) return null;

  return (
    <div className="bg-amber-500 text-white px-4 py-2 text-sm font-medium flex items-center justify-between">
      <span>
        Você está logado como <strong>{user.email}</strong>
        {user.actor_email && <> (operado por {user.actor_email})</>}
      </span>
      <button
        onClick={stopImpersonation}
        className="ml-4 rounded bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30 transition-colors"
      >
        Voltar para admin
      </button>
    </div>
  );
}

function Header() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-950">
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">
        Painel
      </h1>
      {user && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {user.email}
          </span>
          {user.role === "admin" && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              Admin
            </span>
          )}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white text-sm font-medium">
            {user.email.charAt(0).toUpperCase()}
          </div>
        </div>
      )}
    </header>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center animate-pulse">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <p className="text-zinc-500 dark:text-zinc-400">Carregando...</p>
      </div>
    </div>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isLoggedIn } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isLoggedIn) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <Sidebar />
      <div className="ml-60">
        <ImpersonationBanner />
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
