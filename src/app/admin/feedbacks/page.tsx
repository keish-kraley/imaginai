import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateTime } from "@/lib/utils";

export default async function AdminFeedbacksPage() {
  const [dislikes, ratings] = await Promise.all([
    prisma.message.findMany({
      where: { approved: false },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        conversation: { include: { user: { select: { name: true, email: true } } } },
      },
    }),
    prisma.sessionRating.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      where: { rating: { gt: 0 } },
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Feedbacks</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Dislikes com comentário de retrabalho e avaliações de encerramento.
        </p>
      </div>
      <Tabs defaultValue="dislikes">
        <TabsList>
          <TabsTrigger value="dislikes">Dislikes em imagens ({dislikes.length})</TabsTrigger>
          <TabsTrigger value="ratings">Avaliações finais ({ratings.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="dislikes">
          <Card>
            <CardHeader>
              <CardTitle>Imagens rejeitadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dislikes.length === 0 && (
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Nenhum dislike registrado.
                </p>
              )}
              {dislikes.map((d) => (
                <div key={d.id} className="rounded-xl border border-[var(--color-border)] p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-muted-foreground)]">
                    <span>
                      {d.conversation.user.name} — {d.conversation.user.email}
                    </span>
                    <span>{formatDateTime(d.createdAt)}</span>
                  </div>
                  <div className="mt-1 italic">Prompt: “{d.imagePrompt}”</div>
                  {d.reworkComment && (
                    <div className="mt-2 rounded-lg bg-red-50 p-2 text-red-700">
                      Retrabalho: {d.reworkComment}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="ratings">
          <Card>
            <CardHeader>
              <CardTitle>Avaliações de sessão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ratings.length === 0 && (
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Nenhuma avaliação enviada.
                </p>
              )}
              {ratings.map((r) => (
                <div key={r.id} className="rounded-xl border border-[var(--color-border)] p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-muted-foreground)]">
                    <span>
                      {r.user.name} — {r.user.email}
                    </span>
                    <span>{formatDateTime(r.createdAt)}</span>
                  </div>
                  <div className="mt-1 font-semibold">
                    {"⭐".repeat(r.rating)}{" "}
                    <span className="text-sm font-normal text-[var(--color-muted-foreground)]">
                      ({r.rating}/5)
                    </span>
                  </div>
                  {r.comment && <div className="mt-2">{r.comment}</div>}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
