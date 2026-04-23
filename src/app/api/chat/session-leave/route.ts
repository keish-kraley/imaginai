import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Best-effort beacon endpoint called by the client on `beforeunload`.
// We don't fail hard because the client cannot handle responses.
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ ok: true });
    const body = (await req.json().catch(() => ({}))) as { comment?: string };
    await prisma.sessionRating.create({
      data: {
        userId: session.user.id,
        rating: 0,
        comment: body.comment ?? null,
      },
    });
  } catch {
    /* swallow */
  }
  return NextResponse.json({ ok: true });
}
