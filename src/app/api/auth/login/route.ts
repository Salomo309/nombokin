import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
} from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const limited = await checkRateLimit(request, {
    key: "login",
    limit: 10,
    windowSeconds: 60,
  });
  if (limited) return limited;

  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Wrong email or password" },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Wrong email or password" },
        { status: 401 }
      );
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "Your account is suspended because this workspace is no longer on the BUSINESS plan. Please contact your workspace owner." },
        { status: 403 }
      );
    }

    const accessToken = await signAccessToken({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    });
    const refreshToken = await signRefreshToken(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      tenant: { id: user.tenant.id, name: user.tenant.name, slug: user.tenant.slug },
    });

    await setAuthCookies(response, accessToken, refreshToken);
    return response;
  } catch (err) {
    console.error("[Auth/Login]", err);
    return NextResponse.json(
      { error: "Something went wrong, please try again" },
      { status: 500 }
    );
  }
}
