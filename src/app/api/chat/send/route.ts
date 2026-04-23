import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { classifyPrompt } from "@/lib/scope";
import { generateImage } from "@/lib/vertex";
import { downloadGcsImage, uploadGeneratedImage } from "@/lib/gcs";
import { checkRateLimit } from "@/lib/ratelimit";
import { env } from "@/lib/env";
import { truncate } from "@/lib/utils";

export const runtime = "nodejs";

const sendSchema = z.object({
  conversationId: z.string().min(1),
  prompt: z.string().trim().min(1).max(2000),
});

type SSEEvent =
  | { type: "status"; text: string }
  | { type: "text"; messageId: string; content: string }
  | {
      type: "image";
      messageId: string;
      imageUrl: string;
      prompt: string;
      refined: boolean;
    }
  | { type: "done"; pendingFeedbackNudge?: string }
  | { type: "error"; message: string };

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const rl = checkRateLimit(`chat:${userId}`, env.CHAT_RATE_LIMIT_PER_MINUTE);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Rate limit atingido. Tente novamente em ${rl.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  const raw = await req.json().catch(() => null);
  const parsed = sendSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const { conversationId, prompt } = parsed.data;

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, userId: true, title: true, _count: { select: { messages: true } } },
  });
  if (!conversation || conversation.userId !== userId) {
    return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });
  }

  // Persist user message first.
  const userMessage = await prisma.message.create({
    data: {
      conversationId,
      role: "USER",
      content: prompt,
    },
  });

  // Auto-title from first message.
  if (conversation._count.messages === 0) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { title: truncate(prompt, 40) },
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: SSEEvent) => {
        controller.enqueue(
          new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`),
        );
      };
      try {
        send({ type: "status", text: "Analisando seu pedido..." });

        // Look up the most recent image in this conversation. If the user is
        // describing a variation of it ("agora em verde", "um pouco maior",
        // "sem puxador"), we feed that image back into the image model as a
        // reference so we edit it in place instead of generating something
        // completely different.
        const previousImageMessage = await prisma.message.findFirst({
          where: {
            conversationId,
            role: "ASSISTANT",
            imageUrl: { not: null },
          },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            imagePrompt: true,
            imageGcsKey: true,
            feedback: true,
          },
        });

        const classification = await classifyPrompt(prompt, {
          previousImagePrompt: previousImageMessage?.imagePrompt ?? undefined,
          previousImageDisliked: previousImageMessage?.feedback === "DISLIKE",
        });

        if (classification.intent !== "generate_image") {
          const reply =
            classification.reply ??
            "Por favor, descreva um objeto doméstico específico para gerar a imagem.";
          const assistant = await prisma.message.create({
            data: {
              conversationId,
              role: "ASSISTANT",
              content: reply,
            },
          });
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
          });
          send({ type: "text", messageId: assistant.id, content: reply });
          send({ type: "done" });
          controller.close();
          return;
        }

        const imagePrompt = (classification.imagePrompt ?? prompt).trim();
        const isRefinement =
          !!classification.isRefinement && !!previousImageMessage?.imageGcsKey;

        send({
          type: "status",
          text: isRefinement
            ? "Ajustando a imagem anterior..."
            : "Gerando imagem...",
        });

        let imageUrl: string;
        let gcsKey: string | null = null;
        if (env.GCP_ENABLED) {
          let reference;
          let effectivePrompt = imagePrompt;
          if (isRefinement && previousImageMessage?.imageGcsKey) {
            try {
              const downloaded = await downloadGcsImage(
                previousImageMessage.imageGcsKey,
              );
              reference = {
                buffer: downloaded.buffer,
                mimeType: downloaded.contentType,
              };
              const base = previousImageMessage.imagePrompt ?? "";
              effectivePrompt = [
                "Você está editando a imagem de referência enviada.",
                base
                  ? `A imagem original representa: "${base}".`
                  : "A imagem original deve ser preservada o máximo possível.",
                "Mantenha o MESMO objeto, MESMO ângulo, MESMA composição, MESMO fundo e MESMO estilo.",
                `Aplique somente esta mudança solicitada pelo idealizador Astra: ${imagePrompt}.`,
                "Não gere um item diferente; apenas ajuste o que foi pedido.",
              ].join(" ");
            } catch (refErr) {
              console.warn(
                "[chat/send] refinement reference download failed, falling back to fresh generation:",
                refErr,
              );
            }
          }
          const buffer = await generateImage(effectivePrompt, reference);
          const uploaded = await uploadGeneratedImage(buffer);
          imageUrl = uploaded.signedUrl;
          gcsKey = uploaded.gcsKey;
        } else {
          imageUrl = buildPlaceholderImage(imagePrompt);
        }

        // Keep track of the full prompt (original + refinement) so the
        // next turn's classifier can reason about the cumulative history.
        const storedImagePrompt = isRefinement && previousImageMessage?.imagePrompt
          ? `${previousImageMessage.imagePrompt} — ajuste: ${imagePrompt}`
          : imagePrompt;
        const assistant = await prisma.message.create({
          data: {
            conversationId,
            role: "ASSISTANT",
            content: isRefinement
              ? "Aqui está a imagem ajustada! 👇"
              : "Aqui está sua imagem! 👇",
            imageUrl,
            imageGcsKey: gcsKey,
            imagePrompt: storedImagePrompt,
          },
        });
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });

        send({
          type: "image",
          messageId: assistant.id,
          imageUrl,
          prompt: imagePrompt,
          refined: isRefinement,
        });

        // Check for nudge: 3+ consecutive user image messages without feedback.
        const pendingCount = await prisma.message.count({
          where: {
            conversation: { userId },
            imageUrl: { not: null },
            approved: null,
          },
        });
        let pendingNudge: string | undefined;
        if (pendingCount >= 3) {
          pendingNudge =
            "⚠️ Você gerou algumas imagens mas não me disse o que achou. Sem o seu retorno (👍 ou 👎), a ideia não será enviada para a Astra. Clique nos botões das imagens que você quer compartilhar com a gente!";
          await prisma.message.create({
            data: {
              conversationId,
              role: "ASSISTANT",
              content: pendingNudge,
            },
          });
        }

        send({ type: "done", pendingFeedbackNudge: pendingNudge });
        controller.close();
      } catch (err) {
        console.error("[chat/send] error:", err);
        try {
          await prisma.message.create({
            data: {
              conversationId,
              role: "ASSISTANT",
              content:
                "Tivemos um problema ao gerar sua imagem. Por favor, tente novamente em instantes.",
            },
          });
        } catch {
          /* ignore */
        }
        send({
          type: "error",
          message:
            err instanceof Error
              ? err.message
              : "Erro interno ao processar sua mensagem.",
        });
        controller.close();
      }
      // Prevent unused warning for userMessage when it isn't referenced after creation.
      void userMessage;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

function buildPlaceholderImage(prompt: string): string {
  // Deterministic per-prompt placeholder so dev screenshots look plausible.
  const seed = encodeURIComponent(prompt.slice(0, 32));
  return `https://picsum.photos/seed/${seed}/768/512`;
}
