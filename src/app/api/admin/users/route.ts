import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["ADMIN"]);
  if (auth instanceof NextResponse) return auth;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      tenant: {
        select: {
          name: true,
          slug: true,
          subscription: { select: { tier: true } },
        },
      },
    },
  });

  return NextResponse.json({ users });
}
