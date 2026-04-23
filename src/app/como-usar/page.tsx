import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { ThumbsDown, ThumbsUp, Sparkles } from "lucide-react";

const GOOD = [
  "Dispenser de sabonete líquido em cerâmica branca estriada, para banheiro.",
  "Escorredor de louças em aço preto com bandeja destacável e porta-talheres.",
  "Caixa d'água modular de polietileno azul de 500L com tampa herméti­ca.",
];

const BAD = [
  "faz uma coisa legal",
  "uma praia linda",
  "copo",
];

export default function ComoUsarPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-white">
        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <h1 className="text-center text-4xl font-semibold tracking-tight sm:text-5xl">
            Como usar o <span className="brand-gradient">ImaginAI</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-[var(--color-muted-foreground)]">
            Dicas rápidas para escrever bons prompts e por que seu feedback é tão
            importante.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-[var(--color-brand-blue)]">
                <Sparkles className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Bons prompts</h3>
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {GOOD.map((g) => (
                  <li key={g} className="rounded-lg bg-[var(--color-brand-blue-soft)] p-3">
                    “{g}”
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-red-500">
                <ThumbsDown className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Prompts para evitar</h3>
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {BAD.map((b) => (
                  <li key={b} className="rounded-lg bg-red-50 p-3 text-red-700">
                    “{b}”
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-[var(--color-muted-foreground)]">
                Lembre-se: o ImaginAI só gera itens para <strong>casa</strong> ou{" "}
                <strong>construção civil</strong>.
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-[var(--color-brand-purple)]/30 bg-[var(--color-brand-purple-soft)] p-6">
            <div className="flex items-center gap-3 text-[var(--color-brand-purple)]">
              <ThumbsUp className="h-5 w-5" />
              <ThumbsDown className="h-5 w-5" />
              <h3 className="text-lg font-semibold">O seu feedback importa</h3>
            </div>
            <p className="mt-2 text-sm text-[var(--color-foreground)]">
              Ao aprovar com 👍, sua ideia é enviada para a equipe da Astra avaliar.
              Ao recusar com 👎, o ImaginAI te pergunta o que ajustar para que possamos
              chegar juntos a uma ideia melhor. <strong>Sem feedback, a ideia não é enviada</strong>.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
