import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Logo } from "@/components/site/logo";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; prompt?: string; mode?: string }>;
}) {
  const session = await auth();
  const sp = await searchParams;
  if (session?.user) {
    const next = sp.next ?? "/chat";
    redirect(sp.prompt ? `${next}?prompt=${encodeURIComponent(sp.prompt)}` : next);
  }

  const mode = sp.mode === "login" ? "login" : "register";
  const hasGoogle = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[var(--color-brand-blue-soft)] via-white to-white px-4 py-10">
      <div className="mb-6 flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
        <Logo className="text-lg" />
        <span>por ASTRA</span>
      </div>
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-white p-8 shadow-sm">
        <h1 className="text-center text-2xl font-semibold">
          {mode === "register" ? "Crie sua conta" : "Entrar na sua conta"}
        </h1>
        <p className="mt-1 text-center text-sm text-[var(--color-muted-foreground)]">
          {mode === "register"
            ? "com a sua conta Google ou com e-mail"
            : "Bem-vindo de volta ao ImaginAI"}
        </p>

        <LoginForm
          mode={mode}
          hasGoogle={hasGoogle}
          next={sp.next}
          pendingPrompt={sp.prompt}
        />

        <p className="mt-6 text-center text-xs text-[var(--color-muted-foreground)]">
          Ao continuar, você concorda com nossos{" "}
          <Link href="/como-usar" className="underline">
            Termos de Serviço
          </Link>{" "}
          e{" "}
          <Link href="/como-usar" className="underline">
            Políticas de Privacidade
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
