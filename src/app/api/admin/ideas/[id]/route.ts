import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  status: z.enum(["RECEIVED", "IN_REVIEW", "CONTACTED", "COMPLETED"]),
  adminNotes: z.string().max(2000).optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const raw = await req.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  await prisma.approvedIdea.update({
    where: { id },
    data: { status: parsed.data.status, adminNotes: parsed.data.adminNotes },
  });
  return NextResponse.json({ ok: true });
}
