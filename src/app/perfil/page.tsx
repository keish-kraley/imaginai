import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ProfileSecurity } from "@/components/profile/profile-security";
import { ProfilePersonal } from "@/components/profile/profile-personal";
import { DeleteAccountCard } from "@/components/profile/delete-account-card";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/perfil");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      role: true,
      twoFactorEnabled: true,
      createdAt: true,
    },
  });
  if (!user) redirect("/login");
  const sp = await searchParams;
  const tab = ["pessoal", "conta", "seguranca"].includes(sp.tab ?? "")
    ? sp.tab
    : "pessoal";

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-[var(--color-muted)]/40">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-semibold">{user.name}</h1>
              <p className="truncate text-sm text-[var(--color-muted-foreground)]">
                {user.email}
              </p>
              {user.role === "ADMIN" && (
                <Badge variant="secondary" className="mt-1">
                  Admin
                </Badge>
              )}
            </div>
            <Button asChild variant="outline">
              <Link href="/perfil?tab=pessoal">Editar perfil</Link>
            </Button>
          </div>

          <Tabs defaultValue={tab as string} className="mt-6">
            <TabsList>
              <TabsTrigger value="pessoal">Pessoal</TabsTrigger>
              <TabsTrigger value="conta">Conta</TabsTrigger>
              <TabsTrigger value="seguranca">Segurança</TabsTrigger>
            </TabsList>
            <TabsContent value="pessoal">
              <ProfilePersonal
                user={{
                  name: user.name,
                  email: user.email,
                }}
              />
            </TabsContent>
            <TabsContent value="conta">
              <DeleteAccountCard />
            </TabsContent>
            <TabsContent value="seguranca">
              <ProfileSecurity twoFactorEnabled={user.twoFactorEnabled} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
