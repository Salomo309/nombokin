import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { requireRole } from "@/lib/guards";
import { getTenantTier } from "@/lib/guards";
import { MAX_TEAM_MEMBERS, INVITE_EXPIRY_DAYS } from "@/lib/team";
import { prisma } from "@/lib/prisma";

// POST /api/team/invite — OWNER (BUSINESS) membuat link undangan (berlaku 7 hari)
export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ["OWNER", "ADMIN"]);
  if (auth instanceof NextResponse) return auth;

  const tier = await getTenantTier(auth.tenantId);
  if (tier !== "BUSINESS") {
    return NextResponse.json(
      { error: "Team members require a BUSINESS subscription" },
      { status: 403 }
    );
  }

  const [memberCount, pendingCount] = await Promise.all([
    prisma.user.count({ where: { tenantId: auth.tenantId } }),
    prisma.inviteToken.count({
      where: { tenantId: auth.tenantId, expiresAt: { gt: new Date() } },
    }),
  ]);

  if (memberCount + pendingCount >= MAX_TEAM_MEMBERS) {
    return NextResponse.json(
      { error: `Team limit reached (max ${MAX_TEAM_MEMBERS} members)` },
      { status: 400 }
    );
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await prisma.inviteToken.create({
    data: {
      tenantId: auth.tenantId,
      role: "MEMBER",
      token,
      expiresAt,
      createdBy: auth.userId,
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  return NextResponse.json({
    inviteUrl: `${appUrl}/register?invite=${token}`,
    expiresAt: expiresAt.toISOString(),
  });
}
