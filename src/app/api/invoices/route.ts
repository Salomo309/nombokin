import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { invoiceSchema } from "@/lib/validators";
import { checkInvoiceLimit, createInvoice, listInvoices } from "@/server/services/invoiceService";
import type { InvoiceType } from "@prisma/client";

// GET /api/invoices — list with filter + search
export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = request.nextUrl;

  const result = await listInvoices(auth.tenantId, {
    type: (searchParams.get("type") ?? "INVOICE") as InvoiceType,
    status: searchParams.get("status") ?? undefined,
    search: searchParams.get("search") ?? "",
    page: parseInt(searchParams.get("page") ?? "1", 10),
    limit: parseInt(searchParams.get("limit") ?? "20", 10),
  });

  return NextResponse.json(result);
}

// POST /api/invoices — create
export async function POST(request: NextRequest) {
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

    // Check tier limit (only for invoices; quotations are not counted)
    const isQuotation = body.type === "QUOTATION";
    if (!isQuotation) {
      const limitCheck = await checkInvoiceLimit(auth.tenantId);
      if (!limitCheck.allowed) {
        return NextResponse.json(
          {
            error: "Free invoice limit reached",
            code: "LIMIT_EXCEEDED",
            count: limitCheck.count,
            limit: limitCheck.limit,
          },
          { status: 403 }
        );
      }
    }

    const invoice = await createInvoice(auth.tenantId, {
      ...parsed.data,
      type: (body.type as InvoiceType) ?? "INVOICE",
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (err) {
    console.error("[Invoice/POST]", err);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
