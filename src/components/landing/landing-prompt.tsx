"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function LandingPrompt({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    startTransition(async () => {
      if (!isAuthenticated) {
        router.push(`/login?next=/chat&prompt=${encodeURIComponent(trimmed)}`);
        return;
      }
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ initialPrompt: trimmed }),
      });
      if (!res.ok) {
        router.push(`/chat?prompt=${encodeURIComponent(trimmed)}`);
        return;
      }
      const data = (await res.json()) as { id: string };
      router.push(`/chat/${data.id}?send=${encodeURIComponent(trimmed)}`);
    });
  }

  return (
    <form
      onSubmit={submit}
      className={cn(
        "relative mx-auto w-full max-w-2xl",
        pending && "pointer-events-none opacity-70",
      )}
    >
      <Input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Armário para banheiro"
        className="h-16 rounded-full border-2 border-[var(--color-brand-purple)] pl-6 pr-16 text-base shadow-sm placeholder:text-[var(--color-brand-purple)]/60"
        aria-label="Descreva sua ideia"
      />
      <button
        type="submit"
        disabled={pending || value.trim().length === 0}
        aria-label="Enviar"
        className="absolute right-2 top-1/2 -translate-y-1/2 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-[#2E5BFF] to-[#6B46C1] text-white shadow-md transition hover:opacity-90 disabled:opacity-40"
      >
        <Send className="h-5 w-5" />
      </button>
    </form>
  );
}
