import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { truncate } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const conversations = await prisma.conversation.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
    take: 100,
  });
  return NextResponse.json({ conversations });
}

const createSchema = z.object({
  initialPrompt: z.string().trim().max(2000).optional(),
  title: z.string().max(120).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const raw = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const { initialPrompt, title } = parsed.data;
  const computedTitle =
    title?.trim() ||
    (initialPrompt ? truncate(initialPrompt, 40) : "Nova conversa");
  const conversation = await prisma.conversation.create({
    data: {
      userId: session.user.id,
      title: computedTitle,
    },
  });
  return NextResponse.json({ id: conversation.id, title: conversation.title });
}
