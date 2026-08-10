import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
} from "@/lib/auth";
import { registerSchema } from "@/lib/validators";
import { slugify } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password, tenantName } = parsed.data;

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email sudah digunakan" },
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
        },
      });

      await tx.subscription.create({
        data: { tenantId: tenant.id, tier: "FREE", status: "ACTIVE" },
      });

      return { user, tenant };
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
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
      },
      { status: 201 }
    );

    await setAuthCookies(response, accessToken, refreshToken);
    return response;
  } catch (err) {
    console.error("[Auth/Register]", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan, coba lagi" },
      { status: 500 }
    );
  }
}
