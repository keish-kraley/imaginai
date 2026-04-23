import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  acceptTerms: z.literal(true),
});

export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos. Senha deve ter no mínimo 8 caracteres." },
      { status: 400 },
    );
  }
  const { name, email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Este e-mail já está cadastrado." },
      { status: 409 },
    );
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      termsAcceptedAt: new Date(),
    },
  });
  return NextResponse.json({ id: user.id, email: user.email });
}
