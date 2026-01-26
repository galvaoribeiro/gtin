"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

type Variant = "landing" | "simple";

type NavItem =
  | { label: string; href: string; type: "link" }
  | { label: string; anchor: string; type: "anchor" };

interface LandingNavbarProps {
  variant?: Variant;
}

export function LandingNavbar({ variant = "landing" }: LandingNavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const anchorItems: NavItem[] = [
    { label: "Benefícios", anchor: "benefits", type: "anchor" },
    { label: "Funcionalidades", anchor: "features", type: "anchor" },
    { label: "API", anchor: "api", type: "anchor" },
    { label: "Planos", anchor: "pricing", type: "anchor" },
  ];

  const simpleItems: NavItem[] = [
    { label: "Home", href: "/", type: "link" },
    { label: "Docs", href: "/docs", type: "link" },
    { label: "Preços", href: "/pricing", type: "link" },
  ];

  const bulkLink: NavItem = { label: "Bulk", href: "/bulk", type: "link" };

  const handleScrollTo = (sectionId: string) => {
    if (variant !== "landing") return;
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setIsMenuOpen(false);
  };

  const desktopItems =
    variant === "landing" ? [...anchorItems, bulkLink] : [bulkLink, ...simpleItems];
  const mobileItems = desktopItems;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="inline-flex items-center">
            <img src="/landing/logo.png" alt="PESQUISA GTIN" className="h-44 w-auto" />
          </Link>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {desktopItems.map((item) =>
            item.type === "anchor" ? (
              <button
                key={item.label}
                onClick={() => handleScrollTo(item.anchor)}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            )
          )}
          <div className="flex items-center gap-4 ml-4">
            <Link href="/login">
              <Button variant="ghost" className="font-medium text-muted-foreground hover:text-primary">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button className="rounded-full px-6 bg-primary hover:bg-primary/90 text-white font-medium">
                Começar agora
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-background border-b border-border p-6 flex flex-col gap-4 shadow-lg animate-in slide-in-from-top-5">
          {mobileItems.map((item) =>
            item.type === "anchor" ? (
              <button
                key={item.label}
                onClick={() => handleScrollTo(item.anchor)}
                className="text-base font-medium text-left cursor-pointer"
              >
                {item.label}
              </button>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className="text-base font-medium text-left"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            )
          )}
          <div className="h-px bg-border my-2" />
          <Link href="/login" className="w-full" onClick={() => setIsMenuOpen(false)}>
            <Button variant="ghost" className="justify-start w-full">
              Login
            </Button>
          </Link>
          <Link href="/register" className="w-full" onClick={() => setIsMenuOpen(false)}>
            <Button className="w-full bg-primary text-white">Começar agora</Button>
          </Link>
        </div>
      )}
    </nav>
  );
}
