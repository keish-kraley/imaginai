"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { cn, formatTime } from "@/lib/utils";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ImageCard } from "@/components/chat/image-card";
import { useSessionRating } from "@/components/chat/session-rating-provider";
import type { ChatMessage } from "@/components/chat/types";

const INACTIVITY_NUDGE_MS = 10 * 60 * 1000;

export function ChatView({
  conversationId,
  initialMessages,
  autoSendPrompt,
}: {
  conversationId: string;
  initialMessages: ChatMessage[];
  autoSendPrompt?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const autoSentRef = useRef(false);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const { requestRating } = useSessionRating();

  const hasPendingFeedback = useMemo(
    () => messages.some((m) => m.imageUrl && m.approved === null),
    [messages],
  );

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (!hasPendingFeedback) return;
    inactivityTimerRef.current = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `nudge-${Date.now()}`,
          role: "ASSISTANT",
          content:
            "⚠️ Notei que você ficou um tempinho sem interagir. Sem o seu retorno (👍 ou 👎), a ideia não será enviada para a Astra avaliar. Dê um feedback nas imagens que você quer compartilhar conosco!",
          imageUrl: null,
          imagePrompt: null,
          feedback: null,
          approved: null,
          createdAt: new Date().toISOString(),
        },
      ]);
    }, INACTIVITY_NUDGE_MS);
  }, [hasPendingFeedback]);

  useEffect(() => {
    resetInactivityTimer();
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [resetInactivityTimer]);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const send = useCallback(
    async (rawPrompt: string) => {
      const prompt = rawPrompt.trim();
      if (!prompt || sending) return;
      setSending(true);
      setInput("");

      const tempUserId = `temp-${Date.now()}`;
      const tempAssistantId = `temp-a-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: tempUserId,
          role: "USER",
          content: prompt,
          imageUrl: null,
          imagePrompt: null,
          feedback: null,
          approved: null,
          createdAt: new Date().toISOString(),
        },
        {
          id: tempAssistantId,
          role: "ASSISTANT",
          content: "…",
          imageUrl: null,
          imagePrompt: null,
          feedback: null,
          approved: null,
          createdAt: new Date().toISOString(),
          pending: true,
        },
      ]);

      try {
        const res = await fetch("/api/chat/send", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ conversationId, prompt }),
        });
        if (!res.ok || !res.body) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        const processLine = (line: string) => {
          if (!line.startsWith("data: ")) return;
          const data = line.slice(6);
          if (!data) return;
          try {
            const event = JSON.parse(data) as
              | { type: "status"; text: string }
              | { type: "text"; messageId: string; content: string }
              | { type: "image"; messageId: string; imageUrl: string; prompt: string }
              | { type: "done"; pendingFeedbackNudge?: string }
              | { type: "error"; message: string };
            applyEvent(event);
          } catch {
            /* ignore */
          }
        };

        const applyEvent = (event: {
          type: string;
          [key: string]: unknown;
        }) => {
          if (event.type === "status") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempAssistantId
                  ? { ...m, content: String(event.text ?? "…") }
                  : m,
              ),
            );
            return;
          }
          if (event.type === "text") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempAssistantId
                  ? {
                      ...m,
                      id: String(event.messageId),
                      content: String(event.content ?? ""),
                      pending: false,
                    }
                  : m,
              ),
            );
            return;
          }
          if (event.type === "image") {
            const refined = Boolean((event as { refined?: boolean }).refined);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempAssistantId
                  ? {
                      ...m,
                      id: String(event.messageId),
                      content: refined
                        ? "Aqui está a imagem ajustada! 👇"
                        : "Aqui está sua imagem! 👇",
                      imageUrl: String(event.imageUrl),
                      imagePrompt: String(event.prompt ?? ""),
                      pending: false,
                    }
                  : m,
              ),
            );
            return;
          }
          if (event.type === "done") {
            const nudge = (event as { pendingFeedbackNudge?: string }).pendingFeedbackNudge;
            if (nudge) {
              setMessages((prev) => [
                ...prev,
                {
                  id: `nudge-${Date.now()}`,
                  role: "ASSISTANT",
                  content: nudge,
                  imageUrl: null,
                  imagePrompt: null,
                  feedback: null,
                  approved: null,
                  createdAt: new Date().toISOString(),
                },
              ]);
            }
          }
          if (event.type === "error") {
            toast.error(String(event.message ?? "Erro ao gerar imagem"));
          }
        };

        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";
          for (const chunk of parts) {
            for (const line of chunk.split("\n")) processLine(line);
          }
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Erro ao enviar mensagem",
        );
        setMessages((prev) => prev.filter((m) => m.id !== tempAssistantId));
      } finally {
        setSending(false);
        router.refresh();
      }
    },
    [conversationId, sending, router],
  );

  // Auto-send passed prompt once.
  useEffect(() => {
    if (!autoSendPrompt || autoSentRef.current) return;
    autoSentRef.current = true;
    send(autoSendPrompt);
    // Clean the URL.
    const url = new URL(window.location.href);
    url.searchParams.delete("send");
    window.history.replaceState({}, "", url.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSendPrompt]);

  const handleFeedback = useCallback(
    async (messageId: string, feedback: "LIKE" | "DISLIKE") => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                feedback,
                approved: feedback === "LIKE",
                reworkPending: feedback === "DISLIKE",
              }
            : m,
        ),
      );
      try {
        const res = await fetch("/api/chat/feedback", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messageId, feedback }),
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(err.error ?? "Falha ao enviar feedback");
        }
        const data = (await res.json()) as {
          assistantMessage: {
            id: string;
            content: string;
            createdAt: string;
            role: "ASSISTANT";
          };
        };
        setMessages((prev) => [
          ...prev,
          {
            id: data.assistantMessage.id,
            role: "ASSISTANT",
            content: data.assistantMessage.content,
            imageUrl: null,
            imagePrompt: null,
            feedback: null,
            approved: null,
            createdAt: data.assistantMessage.createdAt,
          },
        ]);
        if (feedback === "LIKE") {
          toast.success("Ideia enviada para a Astra!");
          requestRating();
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao enviar feedback");
      }
    },
    [requestRating],
  );

  const handleReworkSubmit = useCallback(
    async (messageId: string, comment: string) => {
      try {
        const res = await fetch("/api/chat/feedback", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            messageId,
            feedback: "DISLIKE",
            reworkComment: comment,
          }),
        });
        if (!res.ok) throw new Error("Falha");
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, reworkPending: false } : m,
          ),
        );
        await send(comment);
      } catch {
        toast.error("Não foi possível salvar seu comentário.");
      }
    },
    [send],
  );

  return (
    <div className="relative flex h-full flex-col bg-white">
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
          {messages.length === 0 && (
            <div className="rounded-xl bg-[var(--color-muted)] p-4 text-sm text-[var(--color-muted-foreground)]">
              Olá, idealizador(a) Astra! Descreva o item para casa ou
              construção que você gostaria de ver e eu gero uma prévia em
              segundos. Depois você ajusta com 👍 / 👎 e envia a ideia para
              a Astra avaliar.
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className="flex flex-col">
              {m.role === "USER" && (
                <div className="ml-auto max-w-[80%]">
                  <MessageBubble role="user" content={m.content} />
                  <div className="mt-1 text-right text-[11px] text-[var(--color-muted-foreground)]">
                    {formatTime(m.createdAt)}
                  </div>
                </div>
              )}
              {m.role === "ASSISTANT" && !m.imageUrl && (
                <div className="mr-auto max-w-[80%]">
                  <MessageBubble
                    role="assistant"
                    content={m.content}
                    pending={m.pending}
                  />
                  <div className="mt-1 text-[11px] text-[var(--color-muted-foreground)]">
                    {formatTime(m.createdAt)}
                  </div>
                </div>
              )}
              {m.role === "ASSISTANT" && m.imageUrl && (
                <div className="mr-auto w-full max-w-[min(48rem,100%)]">
                  <MessageBubble role="assistant" content={m.content} />
                  <ImageCard
                    messageId={m.id}
                    imageUrl={m.imageUrl}
                    imagePrompt={m.imagePrompt}
                    feedback={m.feedback}
                    reworkPending={m.reworkPending ?? false}
                    onFeedback={handleFeedback}
                    onReworkSubmit={handleReworkSubmit}
                  />
                  <div className="mt-1 text-[11px] text-[var(--color-muted-foreground)]">
                    {formatTime(m.createdAt)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-[var(--color-border)] bg-white px-4 py-4 sm:px-8"
      >
        <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-2 shadow-sm">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Descreva a imagem que você imagina..."
            className="flex-1 border-0 bg-transparent px-0 py-2 text-sm outline-none placeholder:text-[var(--color-muted-foreground)]"
            disabled={sending}
          />
          <button
            type="submit"
            aria-label="Enviar"
            disabled={sending || input.trim().length === 0}
            className={cn(
              "grid h-10 w-10 place-items-center rounded-full bg-[var(--color-brand-blue)] text-white transition disabled:opacity-40",
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
