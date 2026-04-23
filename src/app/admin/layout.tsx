import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { Logo } from "@/components/site/logo";
import { LayoutDashboard, MessagesSquare, ThumbsDown, Lightbulb, LogOut } from "lucide-react";
import { signOut } from "@/auth";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/conversas", label: "Conversas", icon: MessagesSquare },
  { href: "/admin/feedbacks", label: "Feedbacks", icon: ThumbsDown },
  { href: "/admin/ideias", label: "Ideias", icon: Lightbulb },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/admin/dashboard");
  if (session.user.role !== "ADMIN") redirect("/chat");

  return (
    <div className="flex min-h-screen bg-[var(--color-muted)]/40">
      <aside className="hidden w-64 flex-col border-r border-[var(--color-border)] bg-white md:flex">
        <div className="px-6 py-5">
          <Logo />
          <p className="text-xs text-[var(--color-muted-foreground)]">Painel admin</p>
        </div>
        <nav className="flex-1 px-3">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          ))}
        </nav>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
          className="p-3"
        >
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </form>
      </aside>
      <main className="flex-1 px-4 py-6 sm:px-8">{children}</main>
    </div>
  );
}
