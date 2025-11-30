"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/gtins", label: "GTINs", icon: "🔍" },
  { href: "/api-keys", label: "API Keys", icon: "🔑" },
  { href: "/usage", label: "Uso", icon: "📈" },
  { href: "/billing", label: "Cobrança", icon: "💳" },
  { href: "/settings", label: "Configurações", icon: "⚙️" },
];

function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-60 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-16 items-center border-b border-zinc-200 px-6 dark:border-zinc-800">
        <Link href="/" className="text-xl font-bold text-zinc-900 dark:text-white">
          GTIN Platform
        </Link>
      </div>
      <nav className="flex flex-col gap-1 p-4">
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
      </nav>
    </aside>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-950">
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">
        Painel
      </h1>
    </header>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <Sidebar />
      <div className="ml-60">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}


