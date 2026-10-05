import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPaymentLink } from "@/server/services/paymentService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  const { shareToken } = await params;

  try {
    const invoice = await prisma.invoice.findFirst({
      where: { shareToken, isDeleted: false },
      include: {
        customer: {
          select: {
            name: true,
            company: true,
            email: true,
            whatsapp: true,
          },
        },
        items: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            description: true,
            qty: true,
            unitPrice: true,
            total: true,
          },
        },
        tenant: {
          select: {
            name: true,
            logoUrl: true,
            letterheadSignature: true,
            watermarkText: true,
            subscription: {
              select: {
                tier: true,
              },
            },
            paymentMethods: {
              where: { isActive: true },
              orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
              select: {
                id: true,
                type: true,
                bankName: true,
                accountNumber: true,
                accountHolder: true,
                qrisImageUrl: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const pendingManual = await prisma.payment.findFirst({
      where: { invoiceId: invoice.id, status: "PENDING", paymentMethod: "MANUAL" },
      select: { id: true },
    });

    return NextResponse.json({ ...invoice, hasPendingManual: !!pendingManual });
  } catch (err) {
    console.error("[PublicInvoice/GET]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

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

    const subscription = await prisma.subscription.findUnique({
      where: { tenantId: invoice.tenantId },
    });

    if (!subscription || subscription.tier === "FREE") {
      return NextResponse.json(
        { error: "Online payment is not available for this invoice" },
        { status: 403 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const paymentUrl = await createPaymentLink(invoice.id, invoice.tenantId, appUrl);

    return NextResponse.json({ paymentUrl });
  } catch (err) {
    console.error("[PublicInvoice/POST]", err);
    const message = err instanceof Error ? err.message : "Failed to process payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
