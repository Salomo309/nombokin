import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import {
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
} from "@/lib/auth";
import { registerSchema } from "@/lib/validators";
import { slugify } from "@/lib/utils";
import { sendVerificationEmail } from "@/lib/resend";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const limited = await checkRateLimit(request, {
    key: "register",
    limit: 5,
    windowSeconds: 60,
  });
  if (limited) return limited;

  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password, tenantName } = parsed.data;

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email is already registered" },
        { status: 409 }
      );
    }

    // Generate unique slug
    let slug = slugify(tenantName);
    const existingSlug = await prisma.tenant.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = randomBytes(32).toString("hex");
    const verificationTokenExpiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    // Create tenant + user + subscription in transaction
    const { user, tenant } = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: tenantName, slug },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email,
          name,
          passwordHash,
          role: "OWNER",
          verificationToken,
          verificationTokenExpiresAt,
        },
      });

      await tx.subscription.create({
        data: { tenantId: tenant.id, tier: "FREE", status: "ACTIVE" },
      });

      return { user, tenant };
    });

    // Send verification email (non-blocking failure is fine)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
    await sendVerificationEmail({
      to: user.email,
      name: user.name,
      verifyUrl: `${appUrl}/api/auth/verify-email?token=${verificationToken}`,
    });

    // Issue tokens
    const accessToken = await signAccessToken({
      userId: user.id,
      tenantId: tenant.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = await signRefreshToken(user.id);

    // Store refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: false,
        },
        tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
      },
      { status: 201 }
    );

    await setAuthCookies(response, accessToken, refreshToken);
    return response;
  } catch (err) {
    console.error("[Auth/Register]", err);
    return NextResponse.json(
      { error: "Something went wrong, please try again" },
      { status: 500 }
    );
  }
}
