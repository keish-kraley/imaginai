"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function ProfilePersonal({
  user,
}: {
  user: { name: string; email: string };
}) {
  const [form, setForm] = useState(user);
  const [pending, startTransition] = useTransition();

  function save(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: form.name }),
      });
      if (!res.ok) {
        toast.error("Não foi possível atualizar o perfil.");
        return;
      }
      toast.success("Perfil atualizado!");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações pessoais</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" value={form.email} disabled className="mt-1" />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
