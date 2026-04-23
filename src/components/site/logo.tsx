import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2 text-2xl font-bold tracking-tight",
        className,
      )}
    >
      <span className="text-[var(--color-brand-blue)]">imagin</span>
      <span className="text-[var(--color-brand-purple)]">AI</span>
    </Link>
  );
}
