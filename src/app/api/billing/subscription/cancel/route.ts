import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const body = await request.json();
    const { orderId } = body as { orderId?: string };

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const payment = await prisma.payment.findFirst({
      where: { orderId, tenantId: auth.tenantId },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status === "PENDING") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "CANCELLED" },
      });
    }

    return NextResponse.json({ success: true, status: "CANCELLED" });
  } catch (err) {
    console.error("[BillingCancel/POST]", err);
    return NextResponse.json({ error: "Failed to cancel payment" }, { status: 500 });
  }
}
