"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  CreditCard,
  KeyRound,
  LayoutDashboard,
  LogOut,
  ScanBarcode,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

const sidebarLinks: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/gtins", label: "Consultar GTIN", icon: ScanBarcode },
  { href: "/api-keys", label: "Chave de Acesso", icon: KeyRound },
  { href: "/usage", label: "Uso", icon: BarChart3 },
  { href: "/billing", label: "Cobrança", icon: CreditCard },
  { href: "/settings", label: "Configurações", icon: Settings },
];

const adminLinks: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin/users", label: "Usuários", icon: Users },
  { href: "/admin/organizations", label: "Organizações", icon: Building2 },
];

function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarNavItem({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
}) {
  const pathname = usePathname();
  const active = isNavActive(pathname ?? "", href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
        "outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950",
        active
          ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-100"
      )}
    >
      {active && (
        <span
          className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-emerald-500"
          aria-hidden
        />
      )}
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          active
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300"
        )}
        strokeWidth={1.75}
      />
      {label}
    </Link>
  );
}

function Sidebar() {
  const { logout, user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-16 items-center border-b border-zinc-200 px-5 dark:border-zinc-800">
        <Link
          href="/"
          className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white"
        >
          GTIN Platform
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
        {sidebarLinks.map((link) => (
          <SidebarNavItem key={link.href} {...link} />
        ))}

        {isAdmin && (
          <div className="mt-4">
            <div className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Admin
            </div>
            {adminLinks.map((link) => (
              <SidebarNavItem key={link.href} {...link} />
            ))}
          </div>
        )}
      </nav>
      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
        <Button
          variant="ghost"
          className="h-9 w-full justify-start gap-3 px-3 text-zinc-600 hover:bg-red-50 hover:text-red-700 dark:text-zinc-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
          onClick={logout}
        >
          <LogOut className="size-4" strokeWidth={1.75} />
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
