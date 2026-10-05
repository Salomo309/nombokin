import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { requireRole } from "@/lib/guards";
import { createUpgradeOrder } from "@/server/services/subscriptionService";
import { prisma } from "@/lib/prisma";
import type { BillingInterval, PaidTier } from "@/lib/pricing";

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const roleGate = await requireRole(request, ["OWNER", "ADMIN"]);
  if (roleGate instanceof NextResponse) return roleGate;

  try {
    const body = await request.json();
    const { tier, interval } = body as {
      tier: PaidTier;
      interval: BillingInterval;
    };

    if (!tier || !interval) {
      return NextResponse.json({ error: "Tier and interval are required" }, { status: 400 });
    }

    if (tier !== "PRO" && tier !== "BUSINESS") {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }
    if (interval !== "MONTHLY" && interval !== "YEARLY") {
      return NextResponse.json({ error: "Invalid interval" }, { status: 400 });
    }

    // Get current user email for customer details
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      include: { tenant: true },
    });

    const order = await createUpgradeOrder({
      tenantId: auth.tenantId,
      userId: auth.userId,
      tier,
      interval,
      customerName: user?.name ?? "Pelanggan Nombokin",
      customerEmail: user?.email ?? undefined,
    });

    return NextResponse.json(order);
  } catch (err) {
    console.error("[BillingUpgrade/POST]", err);
    const message = err instanceof Error ? err.message : "Failed to process subscription";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
