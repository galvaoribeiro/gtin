"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

import { DOCS_PAGE_PATH } from "@/lib/marketing/constants";
import { track } from "@/lib/analytics";

type Variant = "landing" | "simple";

type NavItem =
  | { label: string; href: string; type: "link"; external?: boolean }
  | { label: string; anchor: string; type: "anchor" };

interface LandingNavbarProps {
  variant?: Variant;
}

export function LandingNavbar({ variant = "landing" }: LandingNavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const pricingHref = pathname === "/api" || pathname === "/solucao-para-erp" ? "#pricing" : "/api#pricing";

  const landingItems: NavItem[] = [
    { label: "Produto", anchor: "features", type: "anchor" },
    { label: "Benefícios", anchor: "benefits", type: "anchor" },
    { label: "API", href: "/api", type: "link" },
    { label: "Para ERPs", href: "/solucao-para-erp", type: "link" },
    { label: "Documentação", href: DOCS_PAGE_PATH, type: "link" },
    { label: "Planos", href: pricingHref, type: "link" },
  ];

  const simpleItems: NavItem[] = [
    { label: "Home", href: "/", type: "link" },
    { label: "API", href: "/api", type: "link" },
    { label: "Para ERPs", href: "/solucao-para-erp", type: "link" },
    { label: "Documentação", href: DOCS_PAGE_PATH, type: "link" },
    { label: "Planos", href: pricingHref, type: "link" },
  ];

  const handleScrollTo = (sectionId: string) => {
    if (!isHome) {
      window.location.href = `/#${sectionId}`;
      return;
    }
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setIsMenuOpen(false);
  };

  const desktopItems = variant === "landing" ? landingItems : simpleItems;

  const renderNavItem = (item: NavItem, mobile = false) => {
    if (item.type === "anchor") {
      return (
        <button
          key={item.label}
          onClick={() => handleScrollTo(item.anchor)}
          className={`text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer ${
            mobile ? "text-base text-left" : ""
          }`}
        >
          {item.label}
        </button>
      );
    }

    const className = `text-sm font-medium text-muted-foreground hover:text-primary transition-colors ${
      mobile ? "text-base text-left" : ""
    }`;

    if (item.external) {
      return (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
          onClick={() => {
            track("docs_click", { source: "navbar" });
            if (mobile) setIsMenuOpen(false);
          }}
        >
          {item.label}
        </a>
      );
    }

    return (
      <Link
        key={item.label}
        href={item.href}
        className={className}
        onClick={() => mobile && setIsMenuOpen(false)}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="inline-flex items-center">
            <img src="/landing/logo.png" alt="PESQUISA GTIN" className="h-44 w-auto" />
          </Link>
        </div>

        <div className="hidden lg:flex items-center gap-6">
          {desktopItems.map((item) => renderNavItem(item))}
          <div className="flex items-center gap-3 ml-2">
            <Link href="/login">
              <Button variant="ghost" className="font-medium text-muted-foreground hover:text-primary">
                Login
              </Button>
            </Link>
            <Link href="/register" onClick={() => track("signup_click", { source: "navbar" })}>
              <Button className="rounded-full px-6 bg-primary hover:bg-primary/90 text-white font-medium">
                Começar gratuitamente
              </Button>
            </Link>
          </div>
        </div>

        <button className="lg:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 right-0 bg-background border-b border-border p-6 flex flex-col gap-4 shadow-lg animate-in slide-in-from-top-5">
          {desktopItems.map((item) => renderNavItem(item, true))}
          <div className="h-px bg-border my-2" />
          <Link href="/login" className="w-full" onClick={() => setIsMenuOpen(false)}>
            <Button variant="ghost" className="justify-start w-full">
              Login
            </Button>
          </Link>
          <Link href="/register" className="w-full" onClick={() => setIsMenuOpen(false)}>
            <Button className="w-full bg-primary text-white" onClick={() => track("signup_click", { source: "navbar_mobile" })}>
              Começar gratuitamente
            </Button>
          </Link>
        </div>
      )}
    </nav>
  );
}
