import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { teamRoleSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

class LastOwnerError extends Error {}

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

  try {
    const updated = await prisma.$transaction(
      async (tx) => {
        const target = await tx.user.findFirst({
          where: { id, tenantId: auth.tenantId },
        });
        if (!target) return null;

        if (target.role === "OWNER" && parsed.data.role !== "OWNER") {
          const owners = await tx.user.count({
            where: { tenantId: auth.tenantId, role: "OWNER" },
          });
          if (owners <= 1) throw new LastOwnerError();
        }

        return tx.user.update({
          where: { id },
          data: { role: parsed.data.role },
          select: { id: true, name: true, email: true, role: true },
        });
      },
      { isolationLevel: "Serializable" }
    );

    if (!updated) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof LastOwnerError) {
      return NextResponse.json(
        { error: "Cannot demote the last owner" },
        { status: 400 }
      );
    }
    // Abort serializable konkuren → anggap gagal aman, minta coba lagi
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
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

  try {
    const deleted = await prisma.$transaction(
      async (tx) => {
        const target = await tx.user.findFirst({
          where: { id, tenantId: auth.tenantId },
        });
        if (!target) return false;

        if (target.role === "OWNER") {
          const owners = await tx.user.count({
            where: { tenantId: auth.tenantId, role: "OWNER" },
          });
          if (owners <= 1) throw new LastOwnerError();
        }

        await tx.user.delete({ where: { id } });
        return true;
      },
      { isolationLevel: "Serializable" }
    );

    if (!deleted) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof LastOwnerError) {
      return NextResponse.json(
        { error: "Cannot remove the last owner" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
