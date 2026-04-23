import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ChatShell } from "@/components/chat/chat-shell";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/chat");

  const [conversations, user] = await Promise.all([
    prisma.conversation.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, updatedAt: true },
      take: 100,
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, avatarUrl: true, role: true },
    }),
  ]);

  return (
    <ChatShell
      user={{
        id: user?.id ?? session.user.id,
        name: user?.name ?? session.user.name ?? "",
        email: user?.email ?? session.user.email ?? "",
        avatarUrl: user?.avatarUrl ?? null,
        role: user?.role ?? "USER",
      }}
      conversations={conversations.map((c) => ({
        id: c.id,
        title: c.title,
        updatedAt: c.updatedAt.toISOString(),
      }))}
    >
      {children}
    </ChatShell>
  );
}
