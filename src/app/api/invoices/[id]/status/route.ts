import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { InvoiceStatus } from "@prisma/client";
import { updateInvoiceStatus } from "@/server/services/invoiceService";

// PATCH /api/invoices/[id]/status — update invoice status manually
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const body = await request.json();
    const status = body?.status as InvoiceStatus;

    if (!status || !Object.values(InvoiceStatus).includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await updateInvoiceStatus(id, auth.tenantId, status);
    return NextResponse.json({ success: true, message: "Status updated" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update status";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
