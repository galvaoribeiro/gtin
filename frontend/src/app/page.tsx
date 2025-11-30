import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <main className="flex max-w-3xl flex-col items-center text-center">
        <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-6xl">
          GTIN Data Platform
        </h1>
        <p className="mt-6 text-xl leading-8 text-zinc-600 dark:text-zinc-400">
          Plataforma de dados cadastrais e fiscais baseada em GTIN. 
          Consulte NCM, CEST, descrição, marca e muito mais através de uma API 
          de alto desempenho ou pelo painel web.
        </p>
        <div className="mt-10">
          <Button asChild size="lg">
            <Link href="/pricing">
              Começar agora
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
