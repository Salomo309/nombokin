import { NextRequest, NextResponse } from "next/server";
import { requireTier } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

function esc(value: unknown): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function day(d: Date | string | null): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

// GET /api/reports/export?type=invoices|payments — unduh CSV (BISNIS only)
export async function GET(request: NextRequest) {
  const gate = await requireTier(request, "BUSINESS");
  if (gate instanceof NextResponse) return gate;
  const { auth } = gate;

  const type = request.nextUrl.searchParams.get("type") ?? "invoices";
  const stamp = new Date().toISOString().slice(0, 10);

  if (type === "payments") {
    const payments = await prisma.payment.findMany({
      where: { tenantId: auth.tenantId },
      orderBy: { createdAt: "desc" },
    });

    const header = ["order_id", "type", "status", "amount", "method", "description", "created_at"];
    const lines = payments.map((p) =>
      [
        esc(p.orderId),
        esc(p.type),
        esc(p.status),
        esc(p.amount.toString()),
        esc(p.paymentMethod ?? (p.orderId.startsWith("SUB-") ? "MIDTRANS" : "")),
        esc(p.description ?? ""),
        esc(day(p.createdAt)),
      ].join(",")
    );

    return new NextResponse([header.join(","), ...lines].join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="nombokin-payments-${stamp}.csv"`,
      },
    });
  }

  const invoices = await prisma.invoice.findMany({
    where: { tenantId: auth.tenantId, type: "INVOICE", isDeleted: false },
    include: { customer: { select: { name: true } } },
    orderBy: { issueDate: "desc" },
  });

  const header = [
    "number",
    "status",
    "customer",
    "issue_date",
    "due_date",
    "paid_at",
    "total",
  ];
  const lines = invoices.map((inv) =>
    [
      esc(inv.number),
      esc(inv.status),
      esc(inv.customer?.name ?? ""),
      esc(day(inv.issueDate)),
      esc(day(inv.dueDate)),
      esc(day(inv.paidAt)),
      esc(inv.total.toString()),
    ].join(",")
  );

  return new NextResponse([header.join(","), ...lines].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="nombokin-invoices-${stamp}.csv"`,
    },
  });
}
