"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  LogOut,
  LayoutDashboard,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SessionRatingProvider } from "@/components/chat/session-rating-provider";
import { ChatListItem } from "@/components/chat/chat-list-item";
import { Logo } from "@/components/site/logo";

export interface ChatConversation {
  id: string;
  title: string;
  updatedAt: string;
}

export interface ChatUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: "USER" | "ADMIN";
}

export function ChatShell({
  user,
  conversations,
  children,
}: {
  user: ChatUser;
  conversations: ChatConversation[];
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const activeId = typeof params?.conversationId === "string" ? params.conversationId : null;

  async function newConversation() {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Nova conversa" }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { id: string };
    router.push(`/chat/${data.id}`);
    router.refresh();
  }

  return (
    <SessionRatingProvider>
      <div className="flex h-[100dvh] w-full bg-white">
        <aside
          className={cn(
            "flex h-full flex-col border-r border-[var(--color-border)] bg-white transition-all",
            collapsed ? "w-0 overflow-hidden" : "w-60 sm:w-64",
          )}
          aria-hidden={collapsed}
        >
          <div className="flex items-center justify-between px-4 py-4">
            <Logo className="text-base" />
          </div>
          <div className="px-3">
            <button
              type="button"
              onClick={newConversation}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
            >
              <Plus className="h-4 w-4" />
              Nova conversa
            </button>
          </div>
          <div className="mt-3 px-4 text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Chats
          </div>
          <nav className="mt-2 flex-1 overflow-y-auto px-2 pb-2 no-scrollbar">
            {conversations.length === 0 ? (
              <p className="px-3 py-4 text-sm text-[var(--color-muted-foreground)]">
                Você ainda não tem conversas.
              </p>
            ) : (
              conversations.map((c) => (
                <ChatListItem
                  key={c.id}
                  id={c.id}
                  title={c.title}
                  active={activeId === c.id}
                />
              ))
            )}
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="m-2 flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-left hover:bg-[var(--color-muted)]">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{user.name}</div>
                  <div className="truncate text-xs text-[var(--color-muted-foreground)]">
                    {user.email}
                  </div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/perfil" className="flex items-center gap-2">
                  <User className="h-4 w-4" /> Perfil
                </Link>
              </DropdownMenuItem>
              {user.role === "ADMIN" && (
                <DropdownMenuItem asChild>
                  <Link href="/admin/dashboard" className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" /> Painel admin
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href="/perfil?tab=conta" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" /> Configurações
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  void signOut({ callbackUrl: "/" });
                }}
                className="text-red-600"
              >
                <LogOut className="h-4 w-4" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </aside>

        <main className="flex h-full min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-white px-4 py-3">
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              aria-label="Alternar sidebar"
              className="rounded-lg p-1.5 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
            >
              {collapsed ? (
                <PanelLeftOpen className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </button>
            <Avatar className="h-9 w-9 border border-[var(--color-border)]">
              <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
          <div className="min-h-0 flex-1">{children}</div>
        </main>
      </div>
    </SessionRatingProvider>
  );
}
