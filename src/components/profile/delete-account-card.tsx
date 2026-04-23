"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DeleteAccountCard() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function confirmDelete() {
    startTransition(async () => {
      const res = await fetch("/api/user/delete-account", { method: "POST" });
      if (!res.ok) {
        toast.error("Não foi possível excluir a conta.");
        return;
      }
      await signOut({ redirect: false });
      toast.success("Sua conta foi excluída.");
      router.push("/");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Excluir conta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Em conformidade com a LGPD, você pode solicitar a exclusão da sua conta e
          de todos os dados associados (conversas, imagens, avaliações). Essa ação
          não pode ser desfeita.
        </p>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive">Excluir minha conta</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tem certeza?</DialogTitle>
              <DialogDescription>
                Todos os seus dados serão permanentemente apagados.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="destructive"
                onClick={confirmDelete}
                disabled={pending}
              >
                {pending ? "Excluindo..." : "Sim, excluir"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
