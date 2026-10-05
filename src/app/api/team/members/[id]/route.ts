import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { teamRoleSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

async function ownerCount(tenantId: string): Promise<number> {
  return prisma.user.count({ where: { tenantId, role: "OWNER" } });
}

// PATCH /api/team/members/[id] — OWNER ubah role anggota (dengan proteksi owner terakhir)
export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireRole(request, ["OWNER", "ADMIN"]);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = teamRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const target = await prisma.user.findFirst({
    where: { id, tenantId: auth.tenantId },
  });
  if (!target) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (target.role === "OWNER" && parsed.data.role !== "OWNER") {
    if ((await ownerCount(auth.tenantId)) <= 1) {
      return NextResponse.json(
        { error: "Cannot demote the last owner" },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { role: parsed.data.role },
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json(updated);
}

// DELETE /api/team/members/[id] — OWNER hapus anggota (tidak boleh diri sendiri / owner terakhir)
export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireRole(request, ["OWNER", "ADMIN"]);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  if (id === auth.userId) {
    return NextResponse.json(
      { error: "You cannot remove yourself" },
      { status: 400 }
    );
  }

  const target = await prisma.user.findFirst({
    where: { id, tenantId: auth.tenantId },
  });
  if (!target) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (target.role === "OWNER" && (await ownerCount(auth.tenantId)) <= 1) {
    return NextResponse.json(
      { error: "Cannot remove the last owner" },
      { status: 400 }
    );
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
