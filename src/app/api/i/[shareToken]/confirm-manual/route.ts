import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/i/[shareToken]/confirm-manual — klien mengonfirmasi sudah transfer manual.
// Status invoice TIDAK langsung lunas; tercatat sebagai payment PENDING untuk diverifikasi merchant.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  const { shareToken } = await params;

  try {
    const invoice = await prisma.invoice.findFirst({
      where: { shareToken, isDeleted: false },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.type !== "INVOICE") {
      return NextResponse.json(
        { error: "Only invoices can be paid" },
        { status: 400 }
      );
    }

    if (invoice.status === "PAID") {
      return NextResponse.json({ ok: true, alreadyPaid: true });
    }

    // Idempoten: satu konfirmasi pending per invoice cukup
    const existing = await prisma.payment.findFirst({
      where: {
        invoiceId: invoice.id,
        status: "PENDING",
        paymentMethod: "MANUAL",
      },
    });

    if (existing) {
      return NextResponse.json({ ok: true, alreadyPending: true });
    }

    let label = "transfer bank";
    try {
      const body = await request.json();
      const paymentMethodId =
        typeof body?.paymentMethodId === "string" ? body.paymentMethodId : undefined;
      if (paymentMethodId) {
        const method = await prisma.paymentMethod.findFirst({
          where: { id: paymentMethodId, tenantId: invoice.tenantId, isActive: true },
        });
        if (method) {
          label =
            method.type === "CUSTOM_QRIS"
              ? "QRIS"
              : `${method.bankName ?? "bank"} ${method.accountNumber ?? ""}`.trim();
        }
      }
    } catch {
      // body opsional — abaikan bila tidak valid
    }

    await prisma.payment.create({
      data: {
        tenantId: invoice.tenantId,
        invoiceId: invoice.id,
        orderId: `MANUAL-${invoice.number}-${Date.now().toString(36).toUpperCase()}`,
        type: "INVOICE",
        status: "PENDING",
        amount: invoice.total,
        paymentMethod: "MANUAL",
        description: `Konfirmasi transfer manual ${invoice.number} via ${label} — menunggu verifikasi`,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[ConfirmManual/POST]", err);
    return NextResponse.json({ error: "Failed to submit confirmation" }, { status: 500 });
  }
}
