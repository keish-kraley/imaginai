import Image from "next/image";
import Link from "next/link";

export function AstraLogo({ href = "https://astra-sa.com" }: { href?: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center"
      aria-label="Astra"
    >
      <Image
        src="/brand/astra-logo.svg"
        alt="Astra"
        width={426}
        height={184}
        className="h-9 w-auto sm:h-10"
        priority
      />
    </Link>
  );
}
