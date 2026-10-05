import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTransactionStatus, isPaymentSuccessful } from "@/lib/midtrans";
import { handlePaidInvoiceOrder } from "@/server/services/paymentService";

// POST /api/invoices/[id]/check-status — tanya status ke Midtrans lalu tandai lunas bila sudah bayar
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId: auth.tenantId, isDeleted: false },
      select: { id: true, status: true, midtransOrderId: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status === "PAID") {
      return NextResponse.json({ paid: true, alreadyPaid: true });
    }

    if (!invoice.midtransOrderId) {
      return NextResponse.json(
        { error: "No online payment for this invoice" },
        { status: 400 }
      );
    }

    const status = await getTransactionStatus(invoice.midtransOrderId);

    if (!isPaymentSuccessful(status.transaction_status, status.fraud_status)) {
      return NextResponse.json({ paid: false, status: status.transaction_status });
    }

    await handlePaidInvoiceOrder({
      orderId: invoice.midtransOrderId,
      transactionId: status.transaction_id,
    });

    return NextResponse.json({ paid: true });
  } catch (err) {
    console.error("[InvoiceCheckStatus/POST]", err);
    const message = err instanceof Error ? err.message : "Failed to check payment status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
