import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { createSnapTransaction, IS_PRODUCTION, MIDTRANS_CLIENT_KEY } from "@/lib/midtrans";
import { generateShareToken } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  try {
    const body = await request.json();
    const { tier, interval } = body as {
      tier: "PRO" | "BUSINESS";
      interval: "MONTHLY" | "YEARLY";
    };

    if (!tier || !interval) {
      return NextResponse.json({ error: "Tier dan interval wajib diisi" }, { status: 400 });
    }

    let price = 0;
    if (tier === "PRO") {
      price = interval === "MONTHLY" ? 29000 : 299000;
    } else if (tier === "BUSINESS") {
      price = interval === "MONTHLY" ? 59000 : 599000; // Let's set Business yearly to 599000
    }

    // Midtrans order_id max 50 chars — keep it short and unique.
    // Format: SUB-{tier}-{M|Y}-{tenantId}-{token}
    const intervalShort = interval === "MONTHLY" ? "M" : "Y";
    const orderId = `SUB-${tier}-${intervalShort}-${auth.tenantId}-${generateShareToken()
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
    const message = err instanceof Error ? err.message : "Gagal memproses langganan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
