import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/chat", "/perfil", "/admin"];
const ADMIN_PREFIXES = ["/admin"];

export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();
  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }
  if (ADMIN_PREFIXES.some((p) => pathname.startsWith(p))) {
    const role = (req.auth.user as { role?: string } | undefined)?.role;
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/chat", req.nextUrl));
    }
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/chat/:path*", "/perfil/:path*", "/admin/:path*"],
};
