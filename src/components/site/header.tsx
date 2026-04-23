import Link from "next/link";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/logo";
import { AstraLogo } from "@/components/site/astra-logo";
import { HeaderUserMenu } from "@/components/site/header-user-menu";

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--color-border)] bg-[var(--color-brand-blue-soft)]/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-10">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-[var(--color-brand-blue)] md:flex">
            <Link href="/como-funciona" className="hover:opacity-80">
              como funciona
            </Link>
            <Link href="/como-usar" className="hover:opacity-80">
              como usar
            </Link>
            <Link href="/contato" className="hover:opacity-80">
              contato
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <HeaderUserMenu
              user={{
                name: user.name ?? null,
                email: user.email ?? null,
                image: user.image ?? null,
                role: (user.role as "USER" | "ADMIN") ?? "USER",
              }}
            />
          ) : (
            <Button asChild size="sm">
              <Link href="/login">login</Link>
            </Button>
          )}
          <AstraLogo />
        </div>
      </div>
    </header>
  );
}
