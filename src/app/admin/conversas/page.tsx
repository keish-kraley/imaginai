import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

export default async function AdminConversasPage() {
  const conversations = await prisma.conversation.findMany({
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: {
      user: { select: { name: true, email: true } },
      messages: {
        select: { id: true, imageUrl: true, approved: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Conversas</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Todas as conversas, mesmo as sem aprovação.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{conversations.length} conversa(s)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-muted)] text-left text-xs uppercase text-[var(--color-muted-foreground)]">
                <tr>
                  <th className="px-4 py-3">Usuário</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">Título</th>
                  <th className="px-4 py-3">Mensagens</th>
                  <th className="px-4 py-3">Imagens</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Última atividade</th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((c) => {
                  const imageCount = c.messages.filter((m) => m.imageUrl).length;
                  const approvedCount = c.messages.filter((m) => m.approved === true).length;
                  const rejectedCount = c.messages.filter((m) => m.approved === false).length;
                  const noFeedback = imageCount - approvedCount - rejectedCount;
                  return (
                    <tr
                      key={c.id}
                      className="border-t border-[var(--color-border)] hover:bg-[var(--color-muted)]/40"
                    >
                      <td className="px-4 py-3">{c.user.name}</td>
                      <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                        {c.user.email}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/conversas/${c.id}`}
                          className="text-[var(--color-brand-blue)] hover:underline"
                        >
                          {c.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{c.messages.length}</td>
                      <td className="px-4 py-3">{imageCount}</td>
                      <td className="px-4 py-3 space-x-1">
                        {approvedCount > 0 && (
                          <Badge variant="success">{approvedCount} 👍</Badge>
                        )}
                        {rejectedCount > 0 && (
                          <Badge variant="destructive">{rejectedCount} 👎</Badge>
                        )}
                        {noFeedback > 0 && (
                          <Badge variant="warning">{noFeedback} s/ fb</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                        {formatDateTime(c.updatedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
