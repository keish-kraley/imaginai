"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, LayoutDashboard, MessageSquare, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface HeaderUser {
  name: string | null;
  email: string | null;
  image: string | null;
  role: "USER" | "ADMIN";
}

export function HeaderUserMenu({ user }: { user: HeaderUser }) {
  const initial = (user.name ?? user.email ?? "U").charAt(0).toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Abrir menu de usuário"
          className="inline-flex items-center gap-2 rounded-full"
        >
          <Avatar className="h-9 w-9 border border-[var(--color-border)]">
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem asChild>
          <Link href="/chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Meus chats
          </Link>
        </DropdownMenuItem>
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
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            void signOut({ callbackUrl: "/" });
          }}
          className="flex items-center gap-2 text-red-600 focus:bg-red-50 focus:text-red-600"
        >
          <LogOut className="h-4 w-4" /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
