import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { requireRole } from "@/lib/guards";
import { cancelPendingPayment } from "@/server/services/subscriptionService";

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const roleGate = await requireRole(request, ["OWNER", "ADMIN"]);
  if (roleGate instanceof NextResponse) return roleGate;

  try {
    const body = await request.json();
    const { orderId } = body as { orderId?: string };

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const found = await cancelPendingPayment(auth.tenantId, orderId);
    if (!found) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, status: "CANCELLED" });
  } catch (err) {
    console.error("[BillingCancel/POST]", err);
    return NextResponse.json({ error: "Failed to cancel payment" }, { status: 500 });
  }
}
