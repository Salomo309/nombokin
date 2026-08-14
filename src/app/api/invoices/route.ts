import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invoiceSchema } from "@/lib/validators";
import { checkInvoiceLimit, createInvoice } from "@/server/services/invoiceService";
import type { InvoiceType } from "@prisma/client";

// GET /api/invoices — list with filter + search
export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const type = (searchParams.get("type") ?? "INVOICE") as InvoiceType;
  const status = searchParams.get("status");
  const search = searchParams.get("search") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);
  const skip = (page - 1) * limit;

  const where = {
    tenantId: auth.tenantId,
    type,
    isDeleted: false,
    ...(status && status !== "ALL" ? { status: status as never } : {}),
    ...(search
      ? {
          OR: [
            { number: { contains: search, mode: "insensitive" as const } },
            { customer: { name: { contains: search, mode: "insensitive" as const } } },
            { customer: { company: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: { customer: true, items: { select: { id: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.invoice.count({ where }),
  ]);

  return NextResponse.json({ invoices, total, page, limit });
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
