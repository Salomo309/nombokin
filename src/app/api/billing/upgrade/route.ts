import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { createSnapTransaction } from "@/lib/midtrans";
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

    const orderId = `SUB-${auth.tenantId}-${tier}-${interval}-${Date.now()}`;

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

    return NextResponse.json({
      token: snapResponse.token,
      redirectUrl: snapResponse.redirect_url,
    });
  } catch (err) {
    console.error("[BillingUpgrade/POST]", err);
    const message = err instanceof Error ? err.message : "Gagal memproses langganan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
