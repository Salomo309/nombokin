import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { requireRole } from "@/lib/guards";
import { getPrice, intervalShort } from "@/lib/pricing";
import { createSnapTransaction, IS_PRODUCTION, MIDTRANS_CLIENT_KEY } from "@/lib/midtrans";
import { generateShareToken } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const roleGate = await requireRole(request, ["OWNER", "ADMIN"]);
  if (roleGate instanceof NextResponse) return roleGate;

  try {
    const body = await request.json();
    const { tier, interval } = body as {
      tier: "PRO" | "BUSINESS";
      interval: "MONTHLY" | "YEARLY";
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

    const price = getPrice(tier, interval);

    // Midtrans order_id max 50 chars — keep it short and unique.
    // Format: SUB-{tier}-{M|Y}-{tenantId}-{token}
    const orderId = `SUB-${tier}-${intervalShort(interval)}-${auth.tenantId}-${generateShareToken()
      .replace(/[-_]/g, "")
      .slice(0, 8)}`;

    // Get current user email for customer details
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      include: { tenant: true },
    });

    const snapResponse = await createSnapTransaction({
      orderId,
      grossAmount: price,
      customerName: user?.name ?? "Pelanggan Nombokin",
      customerEmail: user?.email ?? undefined,
      invoiceNumber: orderId,
      items: [
        {
          id: `${tier}-${interval}`,
          name: `Langganan Nombokin ${tier} (${interval === "MONTHLY" ? "Bulanan" : "Tahunan"})`,
          price: price,
          quantity: 1,
        },
      ],
    });

    // Record pending subscription payment in history
    await prisma.payment.create({
      data: {
        tenantId: auth.tenantId,
        userId: auth.userId,
        orderId,
        type: "SUBSCRIPTION",
        status: "PENDING",
        amount: price,
        tier,
        interval,
        description: `Langganan ${tier} (${interval === "MONTHLY" ? "Bulanan" : "Tahunan"})`,
      },
    });

    const snapHost = IS_PRODUCTION ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com";

    return NextResponse.json({
      token: snapResponse.token,
      redirectUrl: snapResponse.redirect_url,
      orderId,
      snapScriptUrl: `${snapHost}/snap/snap.js`,
      clientKey: MIDTRANS_CLIENT_KEY,
    });
  } catch (err) {
    console.error("[BillingUpgrade/POST]", err);
    const message = err instanceof Error ? err.message : "Failed to process subscription";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
