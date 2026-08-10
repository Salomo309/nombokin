import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { customerSchema } from "@/lib/validators";

// GET /api/customers — List customers with search
export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") ?? "";

  try {
    const customers = await prisma.customer.findMany({
      where: {
        tenantId: auth.tenantId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { company: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(customers);
  } catch (err) {
    console.error("[Customers/GET]", err);
    return NextResponse.json({ error: "Gagal memuat pelanggan" }, { status: 500 });
  }
}

// POST /api/customers — Create a customer
export async function POST(request: NextRequest) {
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

    const customer = await prisma.customer.create({
      data: {
        tenantId: auth.tenantId,
        name: parsed.data.name,
        company: parsed.data.company || null,
        email: parsed.data.email || null,
        whatsapp: parsed.data.whatsapp || null,
        notes: parsed.data.notes || null,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (err) {
    console.error("[Customers/POST]", err);
    return NextResponse.json({ error: "Gagal membuat pelanggan" }, { status: 500 });
  }
}
