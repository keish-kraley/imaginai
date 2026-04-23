import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { ContactForm } from "@/components/contact/contact-form";

export default function ContatoPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-white">
        <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <h1 className="text-center text-4xl font-semibold tracking-tight sm:text-5xl">
            Fale com a gente
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-center text-[var(--color-muted-foreground)]">
            Dúvidas, sugestões ou feedback sobre o ImaginAI? Envie uma mensagem para
            o time da Astra.
          </p>
          <div className="mt-10">
            <ContactForm />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
