import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paymentMethodSchema } from "@/lib/validators";

// GET /api/payment-methods — daftar metode pembayaran manual milik tenant
export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const methods = await prisma.paymentMethod.findMany({
    where: { tenantId: auth.tenantId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(methods);
}

// POST /api/payment-methods — tambah rekening bank / QRIS
export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = paymentMethodSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const method = await prisma.paymentMethod.create({
      data: {
        tenantId: auth.tenantId,
        type: d.type,
        bankName: d.bankName || null,
        accountNumber: d.accountNumber || null,
        accountHolder: d.accountHolder || null,
        qrisImageUrl: d.qrisImageUrl || null,
        isActive: d.isActive ?? true,
        sortOrder: d.sortOrder ?? 0,
      },
    });

    return NextResponse.json(method, { status: 201 });
  } catch (err) {
    console.error("[PaymentMethods/POST]", err);
    return NextResponse.json({ error: "Failed to save payment method" }, { status: 500 });
  }
}
