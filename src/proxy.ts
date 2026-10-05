import { type NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";

const PROTECTED_PATHS = [
  "/dashboard",
  "/invoices",
  "/quotations",
  "/customers",
  "/products",
  "/payments",
  "/reports",
  "/settings",
  "/admin",
];

const AUTH_PATHS = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (isProtected) {
    const user = await getAuthFromRequest(request);
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Anggota (MEMBER) tidak boleh membuka tab langganan:
    // redirect di sini (mekanisme Proxy terbukti 307 di app ini).
    if (
      user.role === "MEMBER" &&
      pathname === "/settings" &&
      request.nextUrl.searchParams.get("tab") === "langganan"
    ) {
      const profilUrl = new URL("/settings", request.url);
      profilUrl.searchParams.set("tab", "profil");
      return NextResponse.redirect(profilUrl);
    }
  }

  if (isAuthPage) {
    const user = await getAuthFromRequest(request);
    if (user) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|i/|fonts|images|icons).*)",
  ],
};
