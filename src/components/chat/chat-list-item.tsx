"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn, truncate } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface ChatListItemProps {
  id: string;
  title: string;
  active: boolean;
}

export function ChatListItem({ id, title, active }: ChatListItemProps) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(title);
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    setBusy(true);
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text().catch(() => "Erro"));
      toast.success("Chat excluído.");
      if (active) router.push("/chat");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível excluir.");
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  async function handleRename() {
    const newTitle = renameValue.trim();
    if (!newTitle || newTitle === title) {
      setRenameOpen(false);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      if (!res.ok) throw new Error(await res.text().catch(() => "Erro"));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível renomear.");
    } finally {
      setBusy(false);
      setRenameOpen(false);
    }
  }

  return (
    <>
      <div
        className={cn(
          "group relative flex items-center rounded-lg",
          active
            ? "bg-[var(--color-muted)]"
            : "hover:bg-[var(--color-muted)]",
        )}
      >
        <Link
          href={`/chat/${id}`}
          className={cn(
            "min-w-0 flex-1 truncate rounded-lg px-3 py-2 text-sm",
            active ? "font-medium" : "text-[var(--color-foreground)]",
          )}
          title={title}
        >
          {truncate(title, 26)}
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Opções da conversa ${title}`}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "mr-1 grid h-7 w-7 place-items-center rounded-md text-[var(--color-muted-foreground)] opacity-0 transition-opacity hover:bg-white group-hover:opacity-100 focus:opacity-100",
                active && "opacity-100",
              )}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setRenameValue(title);
                setRenameOpen(true);
              }}
              className="flex items-center gap-2"
            >
              <Pencil className="h-4 w-4" /> Renomear
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setConfirmDelete(true);
              }}
              className="flex items-center gap-2 text-red-600 focus:bg-red-50 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear conversa</DialogTitle>
            <DialogDescription>
              Dê um nome novo para este chat.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleRename();
            }}
            className="flex flex-col gap-3"
          >
            <Input
              autoFocus
              value={renameValue}
              maxLength={120}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Nova nome da conversa"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setRenameOpen(false)}
                disabled={busy}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={busy || !renameValue.trim()}>
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir chat?</DialogTitle>
            <DialogDescription>
              Esta ação é permanente. Todas as mensagens e imagens geradas nesta
              conversa serão removidas. Ideias já enviadas para a Astra
              continuam registradas no painel interno.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmDelete(false)}
              disabled={busy}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={busy}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
