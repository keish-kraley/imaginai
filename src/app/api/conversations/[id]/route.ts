import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireOwner(conversationId: string, userId: string) {
  const convo = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, userId: true },
  });
  if (!convo || convo.userId !== userId) return null;
  return convo;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const owner = await requireOwner(id, session.user.id);
  if (!owner) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  return NextResponse.json({ conversation });
}

const patchSchema = z.object({ title: z.string().min(1).max(120) });

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const owner = await requireOwner(id, session.user.id);
  if (!owner) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const conversation = await prisma.conversation.update({
    where: { id },
    data: { title: parsed.data.title },
  });
  return NextResponse.json({ conversation });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const owner = await requireOwner(id, session.user.id);
  if (!owner) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.conversation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
