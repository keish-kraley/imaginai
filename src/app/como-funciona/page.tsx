import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import {
  Pencil,
  Image as ImageIcon,
  ThumbsUp,
  Mail,
  ClipboardCheck,
  Phone,
} from "lucide-react";

const STEPS = [
  {
    icon: Pencil,
    title: "1. Descreva sua ideia",
    text: "Escreva em linguagem natural o item de casa ou construção que você imagina.",
  },
  {
    icon: ImageIcon,
    title: "2. Veja a imagem",
    text: "A IA gera uma prévia da sua ideia em segundos. Itere até ficar do jeito que imaginou.",
  },
  {
    icon: ThumbsUp,
    title: "3. Aprove a melhor versão",
    text: "Use 👍 na imagem que melhor representa a sua ideia. Caso não goste, use 👎 e diga o que ajustar.",
  },
  {
    icon: Mail,
    title: "4. Astra recebe a ideia",
    text: "No 👍, a ideia é enviada automaticamente por e-mail para a equipe da Astra, com o prompt e a imagem.",
  },
  {
    icon: ClipboardCheck,
    title: "5. Análise da equipe",
    text: "Nosso time avalia a viabilidade de protótipo e produção da ideia.",
  },
  {
    icon: Phone,
    title: "6. Retorno em até 7 dias",
    text: "Entramos em contato com o idealizador com um retorno sobre a ideia.",
  },
];

export default function ComoFuncionaPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-white">
        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <h1 className="text-center text-4xl font-semibold tracking-tight sm:text-5xl">
            Como funciona o <span className="brand-gradient">ImaginAI</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-[var(--color-muted-foreground)]">
            Do seu primeiro prompt ao retorno da equipe da Astra: veja cada etapa
            do fluxo.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((s) => (
              <div
                key={s.title}
                className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--color-brand-blue-soft)] text-[var(--color-brand-blue)]">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                  {s.text}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
