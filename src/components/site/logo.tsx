import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="ImaginAI"
      className={cn(
        "inline-flex items-baseline text-2xl font-bold tracking-tight leading-none",
        className,
      )}
    >
      <span className="text-[var(--color-brand-blue)]">imagin</span>
      <span className="-ml-[0.02em] text-[var(--color-brand-purple)]">AI</span>
    </Link>
  );
}
