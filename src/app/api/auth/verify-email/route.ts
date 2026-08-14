import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?verified=error", request.url));
  }

  try {
    const user = await prisma.user.findUnique({
      where: { verificationToken: token },
    });

    if (!user || !user.verificationTokenExpiresAt) {
      return NextResponse.redirect(new URL("/login?verified=invalid", request.url));
    }

    if (user.verificationTokenExpiresAt < new Date()) {
      return NextResponse.redirect(new URL("/login?verified=expired", request.url));
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        verificationToken: null,
        verificationTokenExpiresAt: null,
      },
    });

    return NextResponse.redirect(new URL("/login?verified=1", request.url));
  } catch (err) {
    console.error("[Auth/VerifyEmail]", err);
    return NextResponse.redirect(new URL("/login?verified=error", request.url));
  }
}
