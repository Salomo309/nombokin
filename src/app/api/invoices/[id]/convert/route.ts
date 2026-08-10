import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { convertQuotationToInvoice } from "@/server/services/invoiceService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  try {
    const invoice = await convertQuotationToInvoice(id, auth.tenantId);
    return NextResponse.json(invoice, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal mengkonversi penawaran";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
