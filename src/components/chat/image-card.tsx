"use client";
import Image from "next/image";
import { useState } from "react";
import { ImageIcon, Maximize2, ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function ImageCard({
  messageId,
  imageUrl,
  imagePrompt,
  feedback,
  reworkPending,
  onFeedback,
  onReworkSubmit,
}: {
  messageId: string;
  imageUrl: string;
  imagePrompt?: string | null;
  feedback: "LIKE" | "DISLIKE" | null;
  reworkPending: boolean;
  onFeedback: (messageId: string, feedback: "LIKE" | "DISLIKE") => void;
  onReworkSubmit: (messageId: string, comment: string) => void;
}) {
  const [rework, setRework] = useState("");
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className="mt-2 flex items-start gap-3">
        <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label="Expandir imagem"
            className="group relative block aspect-[4/3] w-full cursor-zoom-in bg-[var(--color-muted)]"
          >
            <Image
              src={imageUrl}
              alt={imagePrompt ?? "Imagem gerada por IA"}
              fill
              sizes="(min-width: 1024px) 42rem, (min-width: 640px) 32rem, 100vw"
              className="object-contain transition-transform duration-200 group-hover:scale-[1.01]"
              unoptimized
              priority={false}
            />
            <span className="pointer-events-none absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              <Maximize2 className="h-4 w-4" />
            </span>
          </button>
          <div className="flex items-center gap-2 border-t border-[var(--color-border)] bg-white px-3 py-2 text-xs text-[var(--color-muted-foreground)]">
            <ImageIcon className="h-3.5 w-3.5" />
            <span className="truncate">
              Imagem gerada por IA{imagePrompt ? ` · "${imagePrompt}"` : ""}
            </span>
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
                placeholder='O que você gostaria de ajustar? Ex.: "deixa verde", "em madeira clara", "um pouco maior"'
                className="min-h-16 bg-white"
              />
              <div className="mt-2 flex items-center justify-between">
                <p className="text-[11px] text-[var(--color-muted-foreground)]">
                  Vou editar a imagem atual mantendo o mesmo item.
                </p>
                <Button type="submit" size="sm" disabled={rework.trim().length === 0}>
                  Ajustar imagem
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

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-[min(90vw,1100px)] bg-black/90 p-0">
          <DialogTitle className="sr-only">Imagem gerada em tamanho real</DialogTitle>
          <DialogDescription className="sr-only">
            {imagePrompt ?? "Imagem gerada pela IA do ImaginAI"}
          </DialogDescription>
          <div className="relative h-[85vh] w-full">
            <Image
              src={imageUrl}
              alt={imagePrompt ?? "Imagem gerada por IA"}
              fill
              sizes="100vw"
              className="object-contain"
              unoptimized
              priority
            />
          </div>
          {imagePrompt && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-4 py-2 text-xs text-white/90">
              {imagePrompt}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
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
