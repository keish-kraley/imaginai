import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "USER" | "ADMIN";
    } & DefaultSession["user"];
  }
}

declare module "next-auth" {
  interface User {
    role?: "USER" | "ADMIN";
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatarUrl ?? undefined,
          role: user.role,
        };
      },
    }),
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [Google]
      : []),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const email = user.email ?? profile?.email;
        if (!email) return false;
        const existing = await prisma.user.findUnique({ where: { email } });
        if (!existing) {
          const name =
            user.name ?? (profile?.name as string | undefined) ?? email.split("@")[0];
          const created = await prisma.user.create({
            data: {
              name,
              email,
              googleId: account.providerAccountId,
              avatarUrl: (user.image as string | undefined) ?? null,
              termsAcceptedAt: new Date(),
            },
          });
          user.id = created.id;
          user.role = created.role;
        } else {
          user.id = existing.id;
          user.role = existing.role;
          if (!existing.googleId) {
            await prisma.user.update({
              where: { id: existing.id },
              data: { googleId: account.providerAccountId },
            });
          }
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? session.user.id;
        session.user.role = (token.role as "USER" | "ADMIN") ?? "USER";
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user?.id) return;
      try {
        await prisma.loginEvent.create({
          data: {
            userId: user.id,
            userAgent: null,
          },
        });
      } catch {
        // Non-fatal.
      }
    },
  },
});
