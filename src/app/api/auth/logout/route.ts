import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth";
import { getAuthFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const user = await getAuthFromRequest(request);
  if (user) {
    await prisma.user.update({
      where: { id: user.userId },
      data: { refreshToken: null },
    }).catch(() => {});
  }

  const response = NextResponse.json({ message: "Berhasil keluar" });
  await clearAuthCookies(response);
  return response;
}
