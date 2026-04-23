"use client";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardCharts({
  byDay,
  topUsers,
}: {
  byDay: { date: string; total: number; approved: number }[];
  topUsers: { name: string; email: string; conversations: number }[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Imagens por dia (30d)</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f6" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" name="Geradas" fill="#2E5BFF" radius={[4, 4, 0, 0]} />
              <Bar dataKey="approved" name="Aprovadas" fill="#6B46C1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Top 10 usuários mais ativos</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm">
            {topUsers.length === 0 && (
              <li className="text-[var(--color-muted-foreground)]">Sem dados ainda.</li>
            )}
            {topUsers.map((u, i) => (
              <li
                key={u.email + i}
                className="flex items-center justify-between gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--color-brand-blue-soft)] text-xs font-semibold text-[var(--color-brand-blue)]">
                    {i + 1}
                  </span>
                  <span className="min-w-0">
                    <div className="truncate font-medium">{u.name}</div>
                    <div className="truncate text-xs text-[var(--color-muted-foreground)]">
                      {u.email}
                    </div>
                  </span>
                </span>
                <span className="text-sm font-semibold">{u.conversations}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
