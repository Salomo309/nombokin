import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkInvoiceLimit } from "@/server/services/invoiceService";

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const [subscription, limitCheck] = await Promise.all([
      prisma.subscription.findUnique({
        where: { tenantId: auth.tenantId },
      }),
      checkInvoiceLimit(auth.tenantId),
    ]);

    const tier = subscription?.tier ?? "FREE";

    return NextResponse.json({
      tier,
      status: subscription?.status ?? "ACTIVE",
      currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
      quota:
        tier === "FREE"
          ? { used: limitCheck.count, limit: limitCheck.limit }
          : null,
    });
  } catch (err) {
    console.error("[BillingPlan/GET]", err);
    return NextResponse.json({ error: "Failed to load plan info" }, { status: 500 });
  }
}
