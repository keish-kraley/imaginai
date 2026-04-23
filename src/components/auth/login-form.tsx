"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export function LoginForm({
  mode,
  hasGoogle,
  next,
  pendingPrompt,
}: {
  mode: "register" | "login";
  hasGoogle: boolean;
  next?: string;
  pendingPrompt?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [pending, startTransition] = useTransition();

  const callbackUrl = buildCallbackUrl(next, pendingPrompt);

  function handleGoogle() {
    if (mode === "register" && !acceptTerms) {
      toast.error("Você precisa aceitar os Termos para continuar.");
      return;
    }
    signIn("google", { callbackUrl });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "register" && !acceptTerms) {
      toast.error("Você precisa aceitar os Termos para se cadastrar.");
      return;
    }
    startTransition(async () => {
      if (mode === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
            acceptTerms: true,
          }),
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          toast.error(err.error ?? "Falha ao criar conta.");
          return;
        }
      }
      const signResult = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (!signResult || signResult.error) {
        toast.error("E-mail ou senha incorretos.");
        return;
      }
      router.push(callbackUrl);
    });
  }

  return (
    <div className="mt-6 space-y-4">
      {hasGoogle && (
        <>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleGoogle}
            disabled={pending}
          >
            <GoogleIcon className="h-4 w-4" />
            Entrar com o Google
          </Button>
          <div className="flex items-center gap-3 text-xs text-[var(--color-muted-foreground)]">
            <div className="h-px flex-1 bg-[var(--color-border)]" />
            ou continue com
            <div className="h-px flex-1 bg-[var(--color-border)]" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === "register" && (
          <div>
            <Label htmlFor="name">Nome de usuário</Label>
            <Input
              id="name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1"
              autoComplete="name"
            />
          </div>
        )}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-1"
            autoComplete="email"
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link
              href="/login?mode=login"
              className="text-xs text-[var(--color-brand-blue)] hover:underline"
            >
              Esqueceu a senha?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="mt-1"
            autoComplete={mode === "register" ? "new-password" : "current-password"}
          />
        </div>

        {mode === "register" && (
          <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/60 p-3 text-xs">
            <Checkbox
              checked={acceptTerms}
              onCheckedChange={(v) => setAcceptTerms(Boolean(v))}
              className="mt-0.5"
            />
            <span>
              Li e aceito os <strong>Termos de Uso</strong> e a{" "}
              <strong>Política de Privacidade</strong> (LGPD), e autorizo o uso da
              ideia enviada pela Astra para fins de avaliação e contato.
            </span>
          </label>
        )}

        <Button
          type="submit"
          variant="dark"
          size="lg"
          className="w-full"
          disabled={pending}
        >
          {pending ? "Aguarde..." : "Entrar"}
        </Button>
      </form>

      <p className="text-center text-sm text-[var(--color-muted-foreground)]">
        {mode === "register" ? (
          <>
            Já possui uma conta?{" "}
            <Link
              href={buildModeSwitchUrl("login", next, pendingPrompt)}
              className="text-[var(--color-brand-blue)] hover:underline"
            >
              Faça login
            </Link>
          </>
        ) : (
          <>
            Ainda não tem conta?{" "}
            <Link
              href={buildModeSwitchUrl("register", next, pendingPrompt)}
              className="text-[var(--color-brand-blue)] hover:underline"
            >
              Cadastre-se
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

function buildCallbackUrl(next?: string, prompt?: string): string {
  const base = next || "/chat";
  if (!prompt) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}prompt=${encodeURIComponent(prompt)}`;
}

function buildModeSwitchUrl(mode: "register" | "login", next?: string, prompt?: string) {
  const params = new URLSearchParams();
  params.set("mode", mode);
  if (next) params.set("next", next);
  if (prompt) params.set("prompt", prompt);
  return `/login?${params.toString()}`;
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.55 5.55 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.54-5.17 3.54-8.86z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.94-2.87l-3.88-3c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.1A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC04"
        d="M5.27 14.33a7.21 7.21 0 0 1 0-4.66V6.56H1.28a12 12 0 0 0 0 10.88l3.99-3.11z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.77 0 3.35.61 4.6 1.8L20 3.17A12 12 0 0 0 12 0 12 12 0 0 0 1.28 6.56l3.99 3.1C6.22 6.82 8.87 4.77 12 4.77z"
      />
    </svg>
  );
}
