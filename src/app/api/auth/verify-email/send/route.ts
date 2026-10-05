import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getAuthFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/resend";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const limited = await checkRateLimit(request, {
    key: "verify-email-send",
    limit: 5,
    windowSeconds: 60,
  });
  if (limited) return limited;

  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.emailVerifiedAt) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      );
    }

    const verificationToken = randomBytes(32).toString("hex");
    const verificationTokenExpiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken, verificationTokenExpiresAt },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
    await sendVerificationEmail({
      to: user.email,
      name: user.name,
      verifyUrl: `${appUrl}/api/auth/verify-email?token=${verificationToken}`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Auth/VerifyEmail/Resend]", err);
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    );
  }
}
