"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function NewConversationClient({ initialPrompt }: { initialPrompt?: string }) {
  const [value, setValue] = useState(initialPrompt ?? "");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const autoSubmitted = useRef(false);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || pending) return;
    startTransition(async () => {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ initialPrompt: trimmed }),
      });
      if (!res.ok) {
        toast.error("Não foi possível criar conversa.");
        return;
      }
      const data = (await res.json()) as { id: string };
      router.push(`/chat/${data.id}?send=${encodeURIComponent(trimmed)}`);
      router.refresh();
    });
  }

  useEffect(() => {
    if (initialPrompt && !autoSubmitted.current) {
      autoSubmitted.current = true;
      submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex w-full max-w-xl gap-2"
    >
      <Input
        placeholder="Ex: prateleira bege minimalista"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button type="submit" disabled={pending || value.trim().length === 0}>
        {pending ? "Abrindo..." : "Começar"}
      </Button>
    </form>
  );
}
