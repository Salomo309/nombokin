import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/products/[id] — Update a product
export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;

  try {
    const existing = await prisma.product.findFirst({
      where: { id, tenantId: auth.tenantId },
    });
    if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const body = await request.json();
    const parsed = productSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid data" },
        { status: 400 }
      );
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.description !== undefined
          ? { description: parsed.data.description || null }
          : {}),
        ...(parsed.data.unitPrice !== undefined
          ? { unitPrice: parsed.data.unitPrice }
          : {}),
        ...(body.active !== undefined ? { active: Boolean(body.active) } : {}),
      },
    });

    return NextResponse.json(product);
  } catch (err) {
    console.error("[Products/PATCH]", err);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// DELETE /api/products/[id] — Delete a product
export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;

  try {
    const existing = await prisma.product.findFirst({
      where: { id, tenantId: auth.tenantId },
    });
    if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Products/DELETE]", err);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
