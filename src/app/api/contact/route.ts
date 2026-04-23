import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  subject: z.string().min(2).max(200),
  message: z.string().min(5).max(5000),
});

export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const data = parsed.data;
  await prisma.contactMessage.create({ data });
  await sendEmail({
    to: env.CONTACT_EMAIL,
    subject: `[ImaginAI Contato] ${data.subject}`,
    html: `<div style="font-family:Arial,sans-serif;">
      <p><strong>De:</strong> ${escape(data.name)} &lt;${escape(data.email)}&gt;</p>
      <p><strong>Assunto:</strong> ${escape(data.subject)}</p>
      <hr/>
      <p style="white-space:pre-wrap;">${escape(data.message)}</p>
    </div>`,
    text: `De: ${data.name} <${data.email}>\nAssunto: ${data.subject}\n\n${data.message}`,
    replyTo: data.email,
  }).catch((e) => console.warn("[contact] email failed:", e));
  return NextResponse.json({ ok: true });
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
