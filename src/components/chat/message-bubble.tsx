import { cn } from "@/lib/utils";

export function MessageBubble({
  role,
  content,
  pending,
}: {
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
}) {
  return (
    <div
      className={cn(
        "inline-block max-w-full whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-sm",
        role === "user"
          ? "bg-[var(--color-brand-blue)] text-white"
          : "bg-[var(--color-muted)] text-[var(--color-foreground)]",
        pending && "opacity-70",
      )}
    >
      {content}
      {pending && <TypingDots />}
    </div>
  );
}

function TypingDots() {
  return (
    <span className="ml-1 inline-flex gap-0.5 align-middle">
      <Dot delay="0ms" />
      <Dot delay="150ms" />
      <Dot delay="300ms" />
    </span>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-current"
      style={{ animationDelay: delay }}
    />
  );
}
