"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Ctx {
  requestRating: () => void;
}

const RatingContext = createContext<Ctx | null>(null);

export function useSessionRating() {
  const ctx = useContext(RatingContext);
  if (!ctx) throw new Error("useSessionRating outside provider");
  return ctx;
}

export function SessionRatingProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const triggeredRef = useRef(false);

  const requestRating = useCallback(() => {
    if (triggeredRef.current) return;
    triggeredRef.current = true;
    setOpen(true);
  }, []);

  // Trigger on beforeunload if not yet rated.
  useEffect(() => {
    let alreadyAsked = false;
    function onBeforeUnload() {
      if (alreadyAsked) return;
      alreadyAsked = true;
      // Use navigator.sendBeacon to capture a "session end" event silently.
      const data = new Blob([JSON.stringify({ rating: 0, comment: "(usuário saiu sem avaliar)" })], {
        type: "application/json",
      });
      navigator.sendBeacon?.("/api/chat/session-leave", data);
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  async function submit(zero = false) {
    setSending(true);
    const finalRating = zero ? 0 : rating;
    if (finalRating < 1 || finalRating > 5) {
      setOpen(false);
      setSending(false);
      return;
    }
    const res = await fetch("/api/chat/session-rating", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rating: finalRating, comment: comment || undefined }),
    });
    setSending(false);
    if (res.ok) {
      toast.success("Obrigado pelo seu feedback!");
    }
    setOpen(false);
    setRating(0);
    setComment("");
  }

  return (
    <RatingContext.Provider value={{ requestRating }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Antes de ir, nos ajude a melhorar!</DialogTitle>
            <DialogDescription>
              Que nota você dá para o ImaginAI?
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className="rounded-full p-1 transition-transform hover:scale-110"
                aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
              >
                <Star
                  className={cn(
                    "h-8 w-8",
                    n <= rating
                      ? "fill-[var(--color-brand-blue)] text-[var(--color-brand-blue)]"
                      : "text-[var(--color-muted-foreground)]",
                  )}
                />
              </button>
            ))}
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Algum comentário? (opcional)"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setRating(0);
                setComment("");
              }}
              disabled={sending}
            >
              Agora não
            </Button>
            <Button
              type="button"
              onClick={() => submit(false)}
              disabled={rating === 0 || sending}
            >
              {sending ? "Enviando..." : "Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RatingContext.Provider>
  );
}
