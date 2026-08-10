import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    include: {
      tenant: {
        include: { subscription: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tenant: {
      id: user.tenant.id,
      name: user.tenant.name,
      slug: user.tenant.slug,
      logoUrl: user.tenant.logoUrl,
      subscription: {
        tier: user.tenant.subscription?.tier ?? "FREE",
        status: user.tenant.subscription?.status ?? "ACTIVE",
        currentPeriodEnd: user.tenant.subscription?.currentPeriodEnd,
      },
    },
  });
}
