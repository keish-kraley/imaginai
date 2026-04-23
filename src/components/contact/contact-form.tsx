"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(err.error ?? "Não foi possível enviar sua mensagem.");
        return;
      }
      toast.success("Mensagem enviada! Obrigado pelo contato.");
      setForm({ name: "", email: "", subject: "", message: "" });
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="subject">Assunto</Label>
        <Input
          id="subject"
          required
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="message">Mensagem</Label>
        <Textarea
          id="message"
          required
          rows={6}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="mt-1"
        />
      </div>
      <Button type="submit" variant="dark" size="lg" disabled={pending} className="w-full">
        {pending ? "Enviando..." : "Enviar mensagem"}
      </Button>
    </form>
  );
}
