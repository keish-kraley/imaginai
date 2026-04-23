import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendIdeaApprovedEmail } from "@/lib/email";
import { generateText } from "@/lib/vertex";
import { env } from "@/lib/env";

const feedbackSchema = z.object({
  messageId: z.string().min(1),
  feedback: z.enum(["LIKE", "DISLIKE"]),
  reworkComment: z.string().max(1000).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const raw = await req.json().catch(() => null);
  const parsed = feedbackSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const { messageId, feedback, reworkComment } = parsed.data;

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { conversation: { include: { user: true } } },
  });
  if (!message || message.conversation.userId !== session.user.id) {
    return NextResponse.json({ error: "Mensagem não encontrada" }, { status: 404 });
  }
  if (!message.imageUrl) {
    return NextResponse.json(
      { error: "Apenas mensagens com imagem aceitam feedback." },
      { status: 400 },
    );
  }

  await prisma.message.update({
    where: { id: messageId },
    data: {
      feedback,
      approved: feedback === "LIKE",
      reworkComment: reworkComment ?? undefined,
    },
  });

  let assistantReply: string;
  if (feedback === "LIKE") {
    assistantReply =
      "Que bom que gostou da ideia! 🎉 A imagem foi enviada para a Astra e nossa equipe entrará em contato com um retorno sobre a ideia em até 7 dias. Gostaria de enviar uma avaliação ou comentário sobre nossa IA?";
    await handleIdeaApproved(messageId);
  } else {
    assistantReply =
      "Poxa, obrigado pelo retorno! O que você gostaria de ajustar nessa ideia? (cor, formato, material, estilo, cenário, etc.)";
  }

  const assistantMessage = await prisma.message.create({
    data: {
      conversationId: message.conversationId,
      role: "ASSISTANT",
      content: assistantReply,
    },
  });
  return NextResponse.json({
    ok: true,
    assistantMessage: {
      id: assistantMessage.id,
      content: assistantReply,
      createdAt: assistantMessage.createdAt,
      role: "ASSISTANT",
    },
  });
}

async function handleIdeaApproved(messageId: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      conversation: {
        include: {
          user: true,
          messages: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });
  if (!message || !message.imageUrl) return;

  await prisma.approvedIdea.upsert({
    where: { messageId: message.id },
    create: { messageId: message.id, status: "RECEIVED" },
    update: {},
  });

  const allPrompts = message.conversation.messages
    .filter((m) => m.role === "USER")
    .map((m) => m.content);

  const summary = await buildSummary(allPrompts, message.imagePrompt ?? "").catch(
    () => allPrompts[allPrompts.length - 1] ?? message.imagePrompt ?? "",
  );

  const emailResult = await sendIdeaApprovedEmail({
    adminEmail: env.ADMIN_EMAIL,
    userName: message.conversation.user.name,
    userEmail: message.conversation.user.email,
    originalPrompt: message.imagePrompt ?? allPrompts[allPrompts.length - 1] ?? "",
    imageUrl: message.imageUrl,
    summary,
    promptHistory: allPrompts,
    createdAt: message.createdAt,
  }).catch((err) => {
    console.warn("[chat/feedback] email send failed:", err);
    return "skipped" as const;
  });

  if (emailResult === "sent") {
    await prisma.message.update({
      where: { id: messageId },
      data: { emailSent: true },
    });
  }
}

async function buildSummary(promptHistory: string[], finalPrompt: string): Promise<string> {
  const joined = promptHistory.map((p, i) => `${i + 1}. ${p}`).join("\n");
  if (!env.GCP_ENABLED) {
    return `${finalPrompt}\n\nPrompts da conversa:\n${joined}`;
  }
  const response = await generateText(
    `Resuma em 1-2 frases o que o idealizador quis criar, mencionando o item e variações que ele testou. Prompt final aprovado: "${finalPrompt}".\n\nHistórico de prompts:\n${joined}`,
    "Você é um assistente que escreve resumos curtos (1-2 frases em português) das ideias enviadas ao ImaginAI.",
  );
  return response;
}
