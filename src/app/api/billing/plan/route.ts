import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId: auth.tenantId },
    });

    return NextResponse.json({
      tier: subscription?.tier ?? "FREE",
      status: subscription?.status ?? "ACTIVE",
      currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
    });
  } catch (err) {
    console.error("[BillingPlan/GET]", err);
    return NextResponse.json({ error: "Gagal memuat info langganan" }, { status: 500 });
  }
}
