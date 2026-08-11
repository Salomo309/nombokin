import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  const payments = await prisma.payment.findMany({
    where: { tenantId: auth.tenantId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: { select: { name: true, email: true } },
      invoice: { select: { number: true } },
    },
  });

  const totalSuccess = await prisma.payment.aggregate({
    where: { tenantId: auth.tenantId, status: "SUCCESS" },
    _sum: { amount: true },
  });

  return NextResponse.json({
    payments,
    totalSuccess: totalSuccess._sum.amount,
  });
}
