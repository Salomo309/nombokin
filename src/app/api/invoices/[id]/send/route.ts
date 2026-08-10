import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { markInvoiceSent } from "@/server/services/invoiceService";
import { prisma } from "@/lib/prisma";
import { buildWhatsAppLink } from "@/lib/utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  try {
    await markInvoiceSent(id, auth.tenantId);

    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId: auth.tenantId },
      include: { customer: true, tenant: true },
    });

    if (!invoice) return NextResponse.json({ error: "Invoice tidak ditemukan" }, { status: 404 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const shareLink = `${appUrl}/i/${invoice.shareToken}`;

    let waLink: string | null = null;
    if (invoice.customer?.whatsapp) {
      const message = `Halo ${invoice.customer.name}, berikut ${invoice.type === "INVOICE" ? "invoice" : "penawaran"} dari ${invoice.tenant.name}:\n\n*${invoice.number}*\n\nLihat & bayar di sini:\n${shareLink}\n\nTerima kasih! 🙏`;
      waLink = buildWhatsAppLink(invoice.customer.whatsapp, message);
    }

    return NextResponse.json({ success: true, shareLink, waLink });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal mengirim invoice";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
