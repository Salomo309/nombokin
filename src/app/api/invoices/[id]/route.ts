import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invoiceSchema } from "@/lib/validators";
import { updateInvoice, softDeleteInvoice } from "@/server/services/invoiceService";

// GET /api/invoices/[id]
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

  return NextResponse.json(invoice);
}

// PATCH /api/invoices/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = invoiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const invoice = await updateInvoice(id, auth.tenantId, parsed.data);
    return NextResponse.json(invoice);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update invoice";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// DELETE /api/invoices/[id] — soft delete
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    await softDeleteInvoice(id, auth.tenantId);
    return NextResponse.json({ message: "Invoice deleted" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete invoice";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
