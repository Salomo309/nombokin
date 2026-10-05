import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paymentMethodPatchSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/payment-methods/[id] — ubah / aktif-nonaktif
export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;

  try {
    const existing = await prisma.paymentMethod.findFirst({
      where: { id, tenantId: auth.tenantId },
    });
    if (!existing) return NextResponse.json({ error: "Payment method not found" }, { status: 404 });

    const body = await request.json();
    const parsed = paymentMethodPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const method = await prisma.paymentMethod.update({
      where: { id },
      data: {
        ...(d.bankName !== undefined ? { bankName: d.bankName || null } : {}),
        ...(d.accountNumber !== undefined ? { accountNumber: d.accountNumber || null } : {}),
        ...(d.accountHolder !== undefined ? { accountHolder: d.accountHolder || null } : {}),
        ...(d.qrisImageUrl !== undefined ? { qrisImageUrl: d.qrisImageUrl || null } : {}),
        ...(d.isActive !== undefined ? { isActive: d.isActive } : {}),
        ...(d.sortOrder !== undefined ? { sortOrder: d.sortOrder } : {}),
      },
    });

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
    const deleted = await prisma.paymentMethod.deleteMany({
      where: { id, tenantId: auth.tenantId },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Payment method not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PaymentMethods/DELETE]", err);
    return NextResponse.json({ error: "Failed to delete payment method" }, { status: 500 });
  }
}
