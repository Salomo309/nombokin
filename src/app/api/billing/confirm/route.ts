import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { requireRole } from "@/lib/guards";
import { confirmMidtransOrder } from "@/server/services/paymentService";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const roleGate = await requireRole(request, ["OWNER", "ADMIN"]);
  if (roleGate instanceof NextResponse) return roleGate;

  try {
    const body = await request.json();
    const { orderId } = body as { orderId: string };

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const payment = await prisma.payment.findFirst({
      where: { orderId, tenantId: auth.tenantId, type: "SUBSCRIPTION" },
    });

    if (!payment) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (payment.status === "SUCCESS") {
      return NextResponse.json({ paid: true, alreadyProcessed: true });
    }

    const result = await confirmMidtransOrder(orderId);

    if (!result.paid) {
      return NextResponse.json({ paid: false, status: result.status });
    }

    return NextResponse.json({ paid: true });
  } catch (err) {
    console.error("[BillingConfirm/POST]", err);
    const message = err instanceof Error ? err.message : "Failed to verify payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}