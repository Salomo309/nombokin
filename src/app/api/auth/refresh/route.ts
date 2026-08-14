import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
  REFRESH_COOKIE,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Refresh token not found" }, { status: 401 });
  }

  try {
    const payload = await verifyRefreshToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Refresh token is invalid or expired" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { tenant: true },
    });

    if (!user || user.refreshToken !== token) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Buat token baru
    const newAccessToken = await signAccessToken({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    });
    const newRefreshToken = await signRefreshToken(user.id);

    // Update refresh token di database (token rotation)
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      tenant: { id: user.tenant.id, name: user.tenant.name, slug: user.tenant.slug },
    });

    await setAuthCookies(response, newAccessToken, newRefreshToken);
    return response;
  } catch (err) {
    console.error("[Auth/Refresh]", err);
    return NextResponse.json({ error: "Failed to refresh session" }, { status: 500 });
  }
}
