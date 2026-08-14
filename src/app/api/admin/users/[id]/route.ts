import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { id } = await context.params;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const data: { name?: string; email?: string; role?: "OWNER" | "MEMBER" | "ADMIN" } = {};
  if (typeof body.name === "string" && body.name.trim()) {
    data.name = body.name.trim();
  }
  if (typeof body.email === "string" && body.email.trim()) {
    data.email = body.email.trim().toLowerCase();
  }
  if (body.role === "OWNER" || body.role === "MEMBER" || body.role === "ADMIN") {
    data.role = body.role;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid changes" }, { status: 400 });
  }

  // Jangan izinkan admin mengubah role-nya sendiri ke non-ADMIN (mencegah kunci diri)
  if (auth.userId === id && data.role && data.role !== "ADMIN") {
    return NextResponse.json(
      { error: "You cannot remove the ADMIN role from your own account" },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenant: { select: { name: true, slug: true } },
      },
    });
    return NextResponse.json({ user });
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "Email is already used by another user" }, { status: 409 });
    }
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2025") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.error("[Admin/Users PATCH]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { id } = await context.params;

  if (auth.userId === id) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 }
    );
  }

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2025") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.error("[Admin/Users DELETE]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
