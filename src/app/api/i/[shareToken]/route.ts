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
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (err) {
    console.error("[PublicInvoice/GET]", err);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
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
      return NextResponse.json({ error: "Invoice tidak ditemukan" }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const paymentUrl = await createPaymentLink(invoice.id, invoice.tenantId, appUrl);

    return NextResponse.json({ paymentUrl });
  } catch (err) {
    console.error("[PublicInvoice/POST]", err);
    const message = err instanceof Error ? err.message : "Gagal memproses pembayaran";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
