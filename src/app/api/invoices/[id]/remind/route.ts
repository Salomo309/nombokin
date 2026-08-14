import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildWhatsAppLink, formatRupiah, formatDate } from "@/lib/utils";
import { sendOverdueReminderEmail } from "@/lib/resend";

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
      include: { customer: true, tenant: true },
    });

    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const shareLink = `${appUrl}/i/${invoice.shareToken}`;
    const formattedTotal = formatRupiah(parseFloat(invoice.total.toString()));
    const formattedDueDate = formatDate(invoice.dueDate);

    // Send email reminder if customer has email
    if (invoice.customer?.email) {
      await sendOverdueReminderEmail({
        to: invoice.customer.email,
        customerName: invoice.customer.name,
        invoiceNumber: invoice.number,
        amount: formattedTotal,
        dueDate: formattedDueDate,
        shareLink,
        tenantName: invoice.tenant.name,
      });
    }

    let waLink: string | null = null;
    if (invoice.customer?.whatsapp) {
      const message = `Halo ${invoice.customer.name}, ini pengingat ramah untuk pembayaran invoice *${invoice.number}* sebesar *${formattedTotal}* dari *${invoice.tenant.name}* yang jatuh tempo pada *${formattedDueDate}*.\n\nAnda dapat melihat detail tagihan dan melakukan pembayaran langsung via QRIS/VA melalui tautan berikut:\n${shareLink}\n\nTerima kasih! 🙏`;
      waLink = buildWhatsAppLink(invoice.customer.whatsapp, message);
    }

    return NextResponse.json({ success: true, shareLink, waLink });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send reminder";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
