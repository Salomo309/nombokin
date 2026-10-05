import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { redisGetJson, redisSetJson } from "@/server/redis";

const CACHE_KEY = "nombokin:admin:dashboard";
const CACHE_TTL = 60; // detik

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["ADMIN"]);
  if (auth instanceof NextResponse) return auth;

  const cached = await redisGetJson<Record<string, unknown>>(CACHE_KEY);
  if (cached) return NextResponse.json(cached);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalRevenue, revenueThisMonth, totalUsers, totalTenants, totalInvoices, totalPayments, recentPayments, invoiceBreakdown, tierBreakdown, revenueByMonthData] =
    await Promise.all([
      prisma.payment.aggregate({
        where: { status: "SUCCESS" },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: "SUCCESS", createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.user.count(),
      prisma.tenant.count(),
      prisma.invoice.count({ where: { isDeleted: false } }),
      prisma.payment.count(),
      prisma.payment.findMany({
        where: { status: "SUCCESS" },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { tenant: { select: { name: true } } },
      }),
      prisma.invoice.groupBy({
        by: ["status"],
        where: { isDeleted: false },
        _count: true,
      }),
      prisma.subscription.groupBy({
        by: ["tier"],
        where: { status: "ACTIVE" },
        _count: true,
      }),
      prisma.payment.findMany({
        where: { status: "SUCCESS", createdAt: { gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } },
        select: { amount: true, createdAt: true },
      }),
    ]);

  // Aggregate revenue per month (last 6 months, oldest → newest)
  const monthKeys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const byMonth = new Map<string, number>();
  for (const key of monthKeys) byMonth.set(key, 0);
  for (const p of revenueByMonthData) {
    const key = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (byMonth.has(key)) byMonth.set(key, byMonth.get(key)! + parseFloat(p.amount.toString()));
  }
  const revenueByMonth = monthKeys.map((key) => {
    const [y, m] = key.split("-").map(Number);
    return {
      month: new Date(y, m - 1, 1).toLocaleDateString("id-ID", { month: "short", year: "2-digit" }),
      amount: byMonth.get(key) ?? 0,
    };
  });

  const payload = {
    totalRevenue: totalRevenue._sum.amount ?? 0,
    revenueThisMonth: revenueThisMonth._sum.amount ?? 0,
    totalUsers,
    totalTenants,
    totalInvoices,
    totalPayments,
    recentPayments,
    invoiceBreakdown,
    tierBreakdown,
    revenueByMonth,
  };

  await redisSetJson(CACHE_KEY, payload, CACHE_TTL);

  return NextResponse.json(payload);
}
