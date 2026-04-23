import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ChatView } from "@/components/chat/chat-view";
import type { ChatMessage } from "@/components/chat/types";

export default async function ChatConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ conversationId: string }>;
  searchParams: Promise<{ send?: string }>;
}) {
  const { conversationId } = await params;
  const sp = await searchParams;
  const session = await auth();
  if (!session?.user?.id) notFound();

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation || conversation.userId !== session.user.id) notFound();

  const messages: ChatMessage[] = conversation.messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    imageUrl: m.imageUrl,
    imagePrompt: m.imagePrompt,
    feedback: m.feedback,
    approved: m.approved,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <ChatView
      conversationId={conversation.id}
      initialMessages={messages}
      autoSendPrompt={sp.send}
    />
  );
}
