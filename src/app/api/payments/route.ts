import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redisGetJson, redisSetJson } from "@/server/redis";

const CACHE_TTL = 30; // detik

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const cacheKey = `nombokin:payments:${auth.tenantId}`;
  const cached = await redisGetJson<Record<string, unknown>>(cacheKey);
  if (cached) return NextResponse.json(cached);

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

  const payload = {
    payments,
    totalSuccess: totalSuccess._sum.amount,
  };

  await redisSetJson(cacheKey, payload, CACHE_TTL);

  return NextResponse.json(payload);
}
