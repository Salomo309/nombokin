import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const type = url.searchParams.get("type");

  const payments = await prisma.payment.findMany({
    where: {
      ...(status ? { status: status as "PENDING" | "SUCCESS" | "CANCELLED" | "FAILED" } : {}),
      ...(type ? { type: type as "SUBSCRIPTION" | "INVOICE" } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      tenant: { select: { name: true, slug: true } },
      user: { select: { name: true, email: true } },
      invoice: { select: { number: true } },
    },
  });

  return NextResponse.json({ payments });
}
