import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ code: z.string().length(6) });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const raw = await req.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Código inválido" }, { status: 400 });
  }
  const token = await prisma.verificationToken.findFirst({
    where: {
      identifier: session.user.id,
      token: parsed.data.code,
      expires: { gt: new Date() },
    },
  });
  if (!token) {
    return NextResponse.json({ error: "Código inválido ou expirado" }, { status: 400 });
  }
  await prisma.verificationToken.deleteMany({
    where: { identifier: session.user.id },
  });
  await prisma.user.update({
    where: { id: session.user.id },
    data: { twoFactorEnabled: true },
  });
  return NextResponse.json({ ok: true });
}
