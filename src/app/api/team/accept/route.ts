import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { teamAcceptSchema } from "@/lib/validators";
import { MAX_TEAM_MEMBERS } from "@/lib/team";

// POST /api/team/accept — publik: tukar token undangan jadi akun anggota
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = teamAcceptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { token, name, email, password } = parsed.data;

    const invite = await prisma.inviteToken.findUnique({ where: { token } });
    if (!invite || invite.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invite link is invalid or expired" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email is already registered" },
        { status: 409 }
      );
    }

    const memberCount = await prisma.user.count({
      where: { tenantId: invite.tenantId },
    });
    if (memberCount >= MAX_TEAM_MEMBERS) {
      return NextResponse.json(
        { error: `Team limit reached (max ${MAX_TEAM_MEMBERS} members)` },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        tenantId: invite.tenantId,
        email,
        name,
        passwordHash,
        role: invite.role,
        emailVerifiedAt: new Date(),
      },
      include: { tenant: true },
    });

    // Token sekali pakai
    await prisma.inviteToken.delete({ where: { id: invite.id } });

    return NextResponse.json(
      {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        tenant: { id: user.tenant.id, name: user.tenant.name, slug: user.tenant.slug },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[TeamAccept/POST]", err);
    return NextResponse.json({ error: "Failed to accept invite" }, { status: 500 });
  }
}
