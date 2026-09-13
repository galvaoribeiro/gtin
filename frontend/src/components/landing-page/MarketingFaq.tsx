"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/landing-page/components/ui/accordion";
import type { FaqItem } from "@/lib/marketing/constants";

type MarketingFaqProps = {
  title?: string;
  items: FaqItem[];
};

export function MarketingFaq({ title = "Perguntas frequentes", items }: MarketingFaqProps) {
  return (
    <section className="py-24 px-6 bg-accent/20">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-semibold text-primary mb-8 text-center">{title}</h2>
        <Accordion type="single" collapsible className="w-full">
          {items.map((item, index) => (
            <AccordionItem key={item.question} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-primary">{item.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
