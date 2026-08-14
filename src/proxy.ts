import { type NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";

const PROTECTED_PATHS = [
  "/dashboard",
  "/invoices",
  "/quotations",
  "/customers",
  "/products",
  "/payments",
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
