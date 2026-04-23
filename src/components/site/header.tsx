import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/logo";
import { AstraLogo } from "@/components/site/astra-logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-2 rounded-full">
                  <Avatar className="h-9 w-9 border border-[var(--color-border)]">
                    <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
                    <AvatarFallback>
                      {(user.name ?? user.email ?? "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/chat">Meus chats</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/perfil">Perfil</Link>
                </DropdownMenuItem>
                {user.role === "ADMIN" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/dashboard">Painel admin</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <form
                    action={async () => {
                      "use server";
                      await signOut({ redirectTo: "/" });
                    }}
                  >
                    <button type="submit" className="w-full text-left">
                      Sair
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
