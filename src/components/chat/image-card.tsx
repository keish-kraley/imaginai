"use client";
import Image from "next/image";
import { useState } from "react";
import { ImageIcon, ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ImageCard({
  messageId,
  imageUrl,
  feedback,
  reworkPending,
  onFeedback,
  onReworkSubmit,
}: {
  messageId: string;
  imageUrl: string;
  feedback: "LIKE" | "DISLIKE" | null;
  reworkPending: boolean;
  onFeedback: (messageId: string, feedback: "LIKE" | "DISLIKE") => void;
  onReworkSubmit: (messageId: string, comment: string) => void;
}) {
  const [rework, setRework] = useState("");

  return (
    <div className="mt-2 flex items-start gap-3">
      <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-sm">
        <div className="relative aspect-[3/2] w-full bg-[var(--color-muted)]">
          <Image
            src={imageUrl}
            alt="Imagem gerada por IA"
            fill
            sizes="(min-width: 768px) 32rem, 100vw"
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="flex items-center gap-2 border-t border-[var(--color-border)] bg-white px-3 py-2 text-xs text-[var(--color-muted-foreground)]">
          <ImageIcon className="h-3.5 w-3.5" />
          Imagem gerada por IA
        </div>
        {reworkPending && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!rework.trim()) return;
              onReworkSubmit(messageId, rework.trim());
              setRework("");
            }}
            className="border-t border-[var(--color-border)] bg-[var(--color-muted)]/60 p-3"
          >
            <Textarea
              autoFocus
              value={rework}
              onChange={(e) => setRework(e.target.value)}
              placeholder="Conte o que ajustar: cor, formato, material, estilo..."
              className="min-h-16 bg-white"
            />
            <div className="mt-2 flex justify-end">
              <Button type="submit" size="sm" disabled={rework.trim().length === 0}>
                Enviar retrabalho
              </Button>
            </div>
          </form>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <FeedbackButton
          active={feedback === "LIKE"}
          disabled={feedback !== null}
          onClick={() => onFeedback(messageId, "LIKE")}
          aria-label="Gostei da imagem"
          variant="like"
        />
        <FeedbackButton
          active={feedback === "DISLIKE"}
          disabled={feedback !== null}
          onClick={() => onFeedback(messageId, "DISLIKE")}
          aria-label="Não gostei da imagem"
          variant="dislike"
        />
      </div>
    </div>
  );
}

function FeedbackButton({
  active,
  disabled,
  onClick,
  variant,
  "aria-label": ariaLabel,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  variant: "like" | "dislike";
  "aria-label": string;
}) {
  const Icon = variant === "like" ? ThumbsUp : ThumbsDown;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full border border-[var(--color-border)] bg-white text-[var(--color-muted-foreground)] transition-colors",
        !disabled && "hover:border-[var(--color-brand-blue)] hover:text-[var(--color-brand-blue)]",
        active &&
          variant === "like" &&
          "border-green-500 bg-green-50 text-green-600",
        active &&
          variant === "dislike" &&
          "border-red-500 bg-red-50 text-red-600",
        disabled && !active && "opacity-40",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
