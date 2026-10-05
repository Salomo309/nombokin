import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { paymentMethodPatchSchema } from "@/lib/validators";
import {
  deletePaymentMethod,
  updatePaymentMethod,
} from "@/server/services/paymentMethodService";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/payment-methods/[id] — ubah / aktif-nonaktif
export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = paymentMethodPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const method = await updatePaymentMethod(auth.tenantId, id, parsed.data);
    if (!method) {
      return NextResponse.json({ error: "Payment method not found" }, { status: 404 });
    }

    return NextResponse.json(method);
  } catch (err) {
    console.error("[PaymentMethods/PATCH]", err);
    return NextResponse.json({ error: "Failed to update payment method" }, { status: 500 });
  }
}

// DELETE /api/payment-methods/[id] — hapus
export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;

  try {
    const ok = await deletePaymentMethod(auth.tenantId, id);
    if (!ok) {
      return NextResponse.json({ error: "Payment method not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PaymentMethods/DELETE]", err);
    return NextResponse.json({ error: "Failed to delete payment method" }, { status: 500 });
  }
}
