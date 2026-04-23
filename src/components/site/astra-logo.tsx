import Link from "next/link";

export function AstraLogo({ href = "https://astra-sa.com" }: { href?: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-astra-red)] px-3 py-1 text-sm font-extrabold text-[var(--color-astra-red)]"
      aria-label="Astra"
    >
      astra
    </Link>
  );
}
