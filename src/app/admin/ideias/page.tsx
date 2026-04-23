import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IdeasTable } from "@/components/admin/ideas-table";

export default async function AdminIdeasPage() {
  const ideas = await prisma.approvedIdea.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      message: {
        include: {
          conversation: {
            include: { user: { select: { name: true, email: true } } },
          },
        },
      },
    },
  });

  const rows = ideas.map((i) => ({
    id: i.id,
    status: i.status,
    adminNotes: i.adminNotes,
    createdAt: i.createdAt.toISOString(),
    userName: i.message.conversation.user.name,
    userEmail: i.message.conversation.user.email,
    prompt: i.message.imagePrompt ?? "",
    imageUrl: i.message.imageUrl ?? "",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Ideias aprovadas</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Acompanhe o status de cada ideia enviada pelos idealizadores.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{rows.length} ideia(s)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <IdeasTable ideas={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
