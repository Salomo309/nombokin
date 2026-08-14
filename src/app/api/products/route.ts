import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validators";

// GET /api/products — List products for tenant
export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const products = await prisma.product.findMany({
      where: { tenantId: auth.tenantId },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(products);
  } catch (err) {
    console.error("[Products/GET]", err);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}

// POST /api/products — Create a product
export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid data" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        tenantId: auth.tenantId,
        name: parsed.data.name,
        description: parsed.data.description || null,
        unitPrice: parsed.data.unitPrice,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    console.error("[Products/POST]", err);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
