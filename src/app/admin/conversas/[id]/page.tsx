import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminConversaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!conversation) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/conversas"
          className="text-sm text-[var(--color-muted-foreground)] hover:underline"
        >
          ← voltar para conversas
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{conversation.title}</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {conversation.user.name} &lt;{conversation.user.email}&gt; ·{" "}
          {formatDateTime(conversation.createdAt)}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Conversa (read-only)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {conversation.messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "USER" ? "justify-end" : "justify-start"}`}
            >
              <div className="max-w-[80%]">
                <div
                  className={`rounded-2xl px-4 py-2 text-sm ${
                    m.role === "USER"
                      ? "bg-[var(--color-brand-blue)] text-white"
                      : "bg-[var(--color-muted)]"
                  }`}
                >
                  {m.content}
                </div>
                {m.imageUrl && (
                  <div className="mt-2 overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
                    <div className="relative aspect-[3/2] w-80 max-w-full">
                      <Image
                        src={m.imageUrl}
                        alt="Imagem"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  </div>
                )}
                <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--color-muted-foreground)]">
                  <span>{formatDateTime(m.createdAt)}</span>
                  {m.approved === true && <Badge variant="success">👍 Aprovada</Badge>}
                  {m.approved === false && <Badge variant="destructive">👎 Rejeitada</Badge>}
                  {m.reworkComment && (
                    <span className="italic">“{m.reworkComment}”</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
