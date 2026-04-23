"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ProfileSecurity({ twoFactorEnabled }: { twoFactorEnabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [pending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(twoFactorEnabled);

  function request() {
    startTransition(async () => {
      const res = await fetch("/api/user/2fa/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ channel: "email", email }),
      });
      if (!res.ok) {
        toast.error("Não foi possível enviar o código.");
        return;
      }
      toast.info(
        "Código enviado para o seu e-mail. Se o SMTP não estiver configurado, o código é `123456` em dev.",
      );
      setStep("verify");
    });
  }

  function verify() {
    startTransition(async () => {
      const res = await fetch("/api/user/2fa/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(err.error ?? "Código inválido.");
        return;
      }
      setEnabled(true);
      setOpen(false);
      toast.success("Autenticação em duas etapas ativada!");
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Segurança</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Row
            title="Senha"
            description="Em breve você poderá alterar sua senha por aqui."
          >
            <Badge variant="muted">Em breve</Badge>
          </Row>
          <Row
            title="Autenticação em Duas Etapas"
            description="Adicione uma camada extra de segurança via e-mail."
          >
            {enabled ? (
              <Badge variant="success">Ativado</Badge>
            ) : (
              <>
                <Badge variant="muted">Desabilitado</Badge>
                <Button size="sm" onClick={() => setOpen(true)}>
                  Verificar
                </Button>
              </>
            )}
          </Row>
          <Row
            title="Sessões Ativas"
            description="Visualize e gerencie dispositivos conectados à sua conta."
          >
            <Badge variant="muted">Em breve</Badge>
          </Row>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Autenticação em duas etapas</DialogTitle>
            <DialogDescription>
              Vamos enviar um código para o seu e-mail para confirmar que é você.
            </DialogDescription>
          </DialogHeader>
          {step === "request" ? (
            <div className="space-y-3">
              <Label htmlFor="email2fa">E-mail para verificação</Label>
              <Input
                id="email2fa"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <Label htmlFor="code2fa">Código de 6 dígitos</Label>
              <Input
                id="code2fa"
                inputMode="numeric"
                pattern="[0-9]{6}"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
              />
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            {step === "request" ? (
              <Button type="button" onClick={request} disabled={pending || !email}>
                {pending ? "Enviando..." : "Enviar código"}
              </Button>
            ) : (
              <Button type="button" onClick={verify} disabled={pending || code.length !== 6}>
                {pending ? "Verificando..." : "Verificar"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] p-4">
      <div className="min-w-0 flex-1">
        <div className="font-medium">{title}</div>
        <div className="text-sm text-[var(--color-muted-foreground)]">
          {description}
        </div>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
