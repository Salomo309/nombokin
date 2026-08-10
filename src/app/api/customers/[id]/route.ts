import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { customerSchema } from "@/lib/validators";

// GET /api/customers/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  try {
    const customer = await prisma.customer.findFirst({
      where: { id, tenantId: auth.tenantId },
    });

    if (!customer) {
      return NextResponse.json({ error: "Pelanggan tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (err) {
    console.error("[CustomerDetail/GET]", err);
    return NextResponse.json({ error: "Gagal memuat detail pelanggan" }, { status: 500 });
  }
}

// PATCH /api/customers/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = customerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updatedCustomer = await prisma.customer.updateMany({
      where: { id, tenantId: auth.tenantId },
      data: {
        name: parsed.data.name,
        company: parsed.data.company || null,
        email: parsed.data.email || null,
        whatsapp: parsed.data.whatsapp || null,
        notes: parsed.data.notes || null,
      },
    });

    if (updatedCustomer.count === 0) {
      return NextResponse.json({ error: "Pelanggan tidak ditemukan atau tidak diijinkan" }, { status: 404 });
    }

    const customer = await prisma.customer.findUnique({ where: { id } });
    return NextResponse.json(customer);
  } catch (err) {
    console.error("[CustomerDetail/PATCH]", err);
    return NextResponse.json({ error: "Gagal mengupdate pelanggan" }, { status: 500 });
  }
}

// DELETE /api/customers/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  try {
    // Delete customer (onDelete SetNull is configured on Invoice model)
    const deleted = await prisma.customer.deleteMany({
      where: { id, tenantId: auth.tenantId },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Pelanggan tidak ditemukan atau tidak diijinkan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Pelanggan berhasil dihapus" });
  } catch (err) {
    console.error("[CustomerDetail/DELETE]", err);
    return NextResponse.json({ error: "Gagal menghapus pelanggan" }, { status: 500 });
  }
}
