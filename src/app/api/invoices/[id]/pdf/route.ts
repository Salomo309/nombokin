import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { generateInvoicePDFBuffer } from "@/lib/pdf/template";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const invoice = await prisma.invoice.findFirst({
    where: { id, tenantId: auth.tenantId, isDeleted: false },
    include: {
      customer: true,
      items: { orderBy: { sortOrder: "asc" } },
      tenant: { include: { subscription: true } },
    },
  });

  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const isWatermarked = invoice.tenant.subscription?.tier === "FREE";

  const buffer = await generateInvoicePDFBuffer(
    {
      number: invoice.number,
      type: invoice.type,
      status: invoice.status,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      subtotal: parseFloat(invoice.subtotal.toString()),
      discountPercent: parseFloat(invoice.discountPercent.toString()),
      taxPercent: parseFloat(invoice.taxPercent.toString()),
      total: parseFloat(invoice.total.toString()),
      notes: invoice.notes,
      terms: invoice.terms,
      customer: invoice.customer
        ? {
            name: invoice.customer.name,
            company: invoice.customer.company,
            email: invoice.customer.email,
            whatsapp: invoice.customer.whatsapp,
          }
        : null,
      items: invoice.items.map((item) => ({
        description: item.description,
        qty: parseFloat(item.qty.toString()),
        unitPrice: parseFloat(item.unitPrice.toString()),
        total: parseFloat(item.total.toString()),
      })),
    },
    {
      name: invoice.tenant.name,
      logoUrl: invoice.tenant.logoUrl,
      letterheadSignature: invoice.tenant.letterheadSignature,
    },
    { isWatermarked }
  );

  const filename = `${invoice.number}.pdf`;
  return new NextResponse(buffer as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(buffer.length),
    },
  });
}
