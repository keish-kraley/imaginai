import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";

const schema = z.object({
  channel: z.enum(["email"]),
  email: z.string().email(),
});

const DEV_FALLBACK_CODE = "123456";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const raw = await req.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const code = env.SMTP_ENABLED
    ? String(Math.floor(100000 + Math.random() * 900000))
    : DEV_FALLBACK_CODE;

  await prisma.verificationToken.deleteMany({
    where: { identifier: session.user.id },
  });
  await prisma.verificationToken.create({
    data: {
      identifier: session.user.id,
      token: code,
      expires: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  await sendEmail({
    to: parsed.data.email,
    subject: "Seu código de verificação ImaginAI",
    html: `<p>Olá!</p><p>Seu código de verificação é: <strong style="font-size:24px;letter-spacing:4px;">${code}</strong></p><p>Ele expira em 10 minutos.</p>`,
    text: `Seu código ImaginAI: ${code}`,
  }).catch((e) => console.warn("[2fa] email failed:", e));

  return NextResponse.json({ ok: true });
}
