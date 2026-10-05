import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/team/members — daftar anggota + undangan aktif milik tenant
export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const [members, invites] = await Promise.all([
    prisma.user.findMany({
      where: { tenantId: auth.tenantId },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.inviteToken.findMany({
      where: { tenantId: auth.tenantId, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      select: { id: true, role: true, expiresAt: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({ members, invites });
}
