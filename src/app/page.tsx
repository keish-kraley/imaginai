import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { LandingPrompt } from "@/components/landing/landing-prompt";
import { ExampleGallery } from "@/components/landing/example-gallery";
import { FALLBACK_EXAMPLES } from "@/lib/example-prompts";

export default async function LandingPage() {
  const session = await auth();
  const dbExamples = await prisma.examplePrompt
    .findMany({ take: 14, orderBy: { createdAt: "desc" } })
    .catch(() => []);
  const examples =
    dbExamples.length >= 7
      ? dbExamples.map((e) => ({ id: e.id, prompt: e.prompt, imageUrl: e.imageUrl }))
      : FALLBACK_EXAMPLES;

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-gradient-to-b from-[var(--color-brand-blue-soft)] via-white to-white">
        <section className="mx-auto w-full max-w-6xl px-4 pt-16 pb-8 text-center sm:px-6">
          <h1 className="text-balance text-5xl font-semibold tracking-tight text-[var(--color-brand-blue)] sm:text-6xl">
            crie com o <span className="text-[var(--color-brand-purple)]">imagin</span>
            <span className="text-[var(--color-brand-purple)]">AI</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-[var(--color-muted-foreground)] sm:text-base">
            Exclusivo para clientes Astra: descreva um item para casa ou
            construção, receba uma prévia em imagem e envie as ideias aprovadas
            direto para o nosso time avaliar.
          </p>
          <div className="mt-10">
            <LandingPrompt isAuthenticated={Boolean(session?.user)} />
          </div>
        </section>
        <ExampleGallery items={examples} />
        <div className="h-16" />
      </main>
      <SiteFooter />
    </>
  );
}
