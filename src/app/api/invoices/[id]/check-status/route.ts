import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { confirmMidtransOrder } from "@/server/services/paymentService";

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

    const result = await confirmMidtransOrder(invoice.midtransOrderId);

    if (!result.paid) {
      return NextResponse.json({ paid: false, status: result.status });
    }

    return NextResponse.json({ paid: true });
  } catch (err) {
    console.error("[InvoiceCheckStatus/POST]", err);
    const message = err instanceof Error ? err.message : "Failed to check payment status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
