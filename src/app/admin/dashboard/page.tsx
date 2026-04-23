import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCharts } from "@/components/admin/dashboard-charts";

export default async function AdminDashboardPage() {
  const now = new Date();
  const last30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
  const last7 = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

  const [
    totalUsers,
    logins7,
    logins30,
    totalImages,
    imagesApproved,
    imagesRejected,
    imagesNoFeedback,
    ratings,
    imagesByDay,
    topUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.loginEvent.count({ where: { createdAt: { gte: last7 } } }),
    prisma.loginEvent.count({ where: { createdAt: { gte: last30 } } }),
    prisma.message.count({ where: { imageUrl: { not: null } } }),
    prisma.message.count({ where: { imageUrl: { not: null }, approved: true } }),
    prisma.message.count({ where: { imageUrl: { not: null }, approved: false } }),
    prisma.message.count({ where: { imageUrl: { not: null }, approved: null } }),
    prisma.sessionRating.aggregate({ _avg: { rating: true }, where: { rating: { gt: 0 } } }),
    prisma.message.findMany({
      where: { imageUrl: { not: null }, createdAt: { gte: last30 } },
      select: { createdAt: true, approved: true },
    }),
    prisma.conversation.groupBy({
      by: ["userId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
  ]);

  const topUserDetails = await prisma.user.findMany({
    where: { id: { in: topUsers.map((u) => u.userId) } },
    select: { id: true, name: true, email: true },
  });
  const topUsersWithName = topUsers.map((tu) => {
    const u = topUserDetails.find((x) => x.id === tu.userId);
    return {
      name: u?.name ?? "—",
      email: u?.email ?? "",
      conversations: tu._count.id,
    };
  });

  const byDay = bucketByDay(imagesByDay, last30, now);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Métricas das últimas interações com o ImaginAI.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric label="Usuários" value={totalUsers} />
        <Metric label="Logins (7d)" value={logins7} />
        <Metric label="Logins (30d)" value={logins30} />
        <Metric label="Imagens geradas" value={totalImages} />
        <Metric label="Aprovadas (👍)" value={imagesApproved} accent="green" />
        <Metric label="Rejeitadas (👎)" value={imagesRejected} accent="red" />
        <Metric label="Sem feedback" value={imagesNoFeedback} accent="amber" />
        <Metric
          label="Nota média"
          value={ratings._avg.rating ? ratings._avg.rating.toFixed(1) : "—"}
        />
      </div>
      <DashboardCharts byDay={byDay} topUsers={topUsersWithName} />
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: "green" | "red" | "amber";
}) {
  const accentClass =
    accent === "green"
      ? "text-green-600"
      : accent === "red"
        ? "text-red-600"
        : accent === "amber"
          ? "text-amber-600"
          : "text-[var(--color-brand-blue)]";
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-[var(--color-muted-foreground)]">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${accentClass}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function bucketByDay(
  data: { createdAt: Date; approved: boolean | null }[],
  from: Date,
  to: Date,
) {
  const days: {
    date: string;
    total: number;
    approved: number;
  }[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  while (cursor <= to) {
    days.push({
      date: cursor.toISOString().slice(0, 10),
      total: 0,
      approved: 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  const byKey = new Map(days.map((d) => [d.date, d]));
  for (const m of data) {
    const key = m.createdAt.toISOString().slice(0, 10);
    const bucket = byKey.get(key);
    if (!bucket) continue;
    bucket.total += 1;
    if (m.approved) bucket.approved += 1;
  }
  return days;
}
