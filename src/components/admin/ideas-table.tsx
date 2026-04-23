"use client";
import Image from "next/image";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

type IdeaStatus = "RECEIVED" | "IN_REVIEW" | "CONTACTED" | "COMPLETED";

interface IdeaRow {
  id: string;
  status: IdeaStatus;
  adminNotes: string | null;
  createdAt: string;
  userName: string;
  userEmail: string;
  prompt: string;
  imageUrl: string;
}

const STATUSES: { value: IdeaStatus; label: string; variant: "secondary" | "success" | "warning" | "muted" }[] = [
  { value: "RECEIVED", label: "Recebida", variant: "muted" },
  { value: "IN_REVIEW", label: "Em análise", variant: "warning" },
  { value: "CONTACTED", label: "Contato feito", variant: "secondary" },
  { value: "COMPLETED", label: "Concluída", variant: "success" },
];

export function IdeasTable({ ideas: initial }: { ideas: IdeaRow[] }) {
  const [ideas, setIdeas] = useState(initial);
  const [pending, startTransition] = useTransition();

  function updateStatus(id: string, status: IdeaStatus) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/ideas/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        toast.error("Não foi possível atualizar o status.");
        return;
      }
      setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
      toast.success("Status atualizado!");
    });
  }

  if (ideas.length === 0) {
    return (
      <p className="p-6 text-sm text-[var(--color-muted-foreground)]">
        Nenhuma ideia aprovada ainda.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-[var(--color-muted)] text-left text-xs uppercase text-[var(--color-muted-foreground)]">
          <tr>
            <th className="px-4 py-3">Imagem</th>
            <th className="px-4 py-3">Idealizador</th>
            <th className="px-4 py-3">Prompt</th>
            <th className="px-4 py-3">Data</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {ideas.map((i) => {
            const current = STATUSES.find((s) => s.value === i.status) ?? STATUSES[0];
            return (
              <tr
                key={i.id}
                className="border-t border-[var(--color-border)] align-top"
              >
                <td className="px-4 py-3">
                  <div className="relative h-16 w-24 overflow-hidden rounded-lg bg-[var(--color-muted)]">
                    {i.imageUrl && (
                      <Image
                        src={i.imageUrl}
                        alt="Ideia"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{i.userName}</div>
                  <div className="text-xs text-[var(--color-muted-foreground)]">
                    {i.userEmail}
                  </div>
                </td>
                <td className="px-4 py-3 max-w-sm">
                  <p className="line-clamp-3 text-sm">{i.prompt || "—"}</p>
                </td>
                <td className="px-4 py-3 text-xs text-[var(--color-muted-foreground)]">
                  {formatDateTime(i.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-2">
                    <Badge variant={current.variant}>{current.label}</Badge>
                    <select
                      disabled={pending}
                      value={i.status}
                      onChange={(e) => updateStatus(i.id, e.target.value as IdeaStatus)}
                      className="rounded-lg border border-[var(--color-border)] bg-white px-2 py-1 text-xs"
                    >
                      {STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
