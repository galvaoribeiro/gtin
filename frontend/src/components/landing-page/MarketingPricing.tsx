"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/landing-page/components/ui/fade-in";
import { MARKETING_PLANS } from "@/lib/marketing/constants";
import { track } from "@/lib/analytics";

type MarketingPricingProps = {
  title?: string;
  description?: string;
  showEnterprise?: boolean;
  showEnterpriseVolume?: boolean;
};

export function MarketingPricing({
  title = "Planos para integração",
  description = "Escolha o volume de consultas conforme o caso de uso do seu sistema.",
  showEnterprise = true,
  showEnterpriseVolume = false,
}: MarketingPricingProps) {
  const publicPlans = MARKETING_PLANS.filter((plan) => plan.id !== "enterprise");

  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-semibold text-primary mb-4">{title}</h2>
          <p className="text-lg text-muted-foreground">{description}</p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          {publicPlans.map((plan, index) => (
            <FadeIn key={plan.id} delay={index * 0.05}>
              <Card
                className={`h-full border-border/50 shadow-sm hover:shadow-md transition-all ${
                  plan.highlighted ? "border-primary shadow-lg relative bg-white" : ""
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute top-0 right-0 -mt-3 mr-4 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl font-semibold text-primary">{plan.name}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">{plan.usageLabel}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-3xl font-bold text-primary">{plan.priceLabel}</div>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className={`w-full rounded-full ${
                      plan.highlighted
                        ? "bg-primary hover:bg-primary/90 text-white"
                        : "bg-primary/10 text-primary hover:bg-primary/20 shadow-none border-0"
                    }`}
                    onClick={() => track("pricing_click", { plan: plan.id })}
                  >
                    <Link href={plan.ctaHref}>{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>

        {showEnterprise && (
          <FadeIn delay={0.2}>
            <Card className="mt-8 border-border/60 bg-slate-50">
              <CardHeader className="md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl text-primary">Enterprise</CardTitle>
                  <CardDescription className="text-base mt-2 max-w-2xl">
                    {MARKETING_PLANS.find((plan) => plan.id === "enterprise")?.usageLabel}
                  </CardDescription>
                </div>
                <Button asChild variant="outline" className="rounded-full shrink-0">
                  <a
                    href={MARKETING_PLANS.find((plan) => plan.id === "enterprise")?.ctaHref}
                    onClick={() => track("contact_sales_click", { source: "enterprise_plan" })}
                  >
                    Falar com nossa equipe
                  </a>
                </Button>
              </CardHeader>
            </Card>
          </FadeIn>
        )}

        {showEnterpriseVolume && (
          <div className="text-center mt-8">
            <p className="text-muted-foreground mb-4">Precisa de mais volume?</p>
            <Button asChild variant="outline" className="rounded-full">
              <a
                href="mailto:contato@pesquisagtin.com.br?subject=Volume%20Enterprise%20Pesquisa%20GTIN"
                onClick={() => track("contact_sales_click", { source: "more_volume" })}
              >
                Falar com nossa equipe
              </a>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
