import { prisma } from "@/lib/prisma";

// Pola acuan A2: route hanya gate + delegasi, seluruh logika bisnis di service.

export interface ReportSummary {
  totals: { invoiced: number; paid: number; outstanding: number; invoiceCount: number };
  monthly: Array<{ month: string; label: string; invoiced: number; paid: number }>;
  clientRecap: Array<{
    customerId: string | null;
    name: string;
    invoiced: number;
    paid: number;
    outstanding: number;
    count: number;
  }>;
  aging: Array<{ key: string; label: string; count: number; total: number }>;
  topOutstanding: Array<{
    id: string;
    number: string;
    customer: string;
    dueDate: string;
    daysOverdue: number;
    total: number;
  }>;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", { month: "short", year: "numeric" }).format(
    new Date(y, m - 1, 1)
  );
}

export async function getReportSummary(tenantId: string): Promise<ReportSummary> {
  const invoices = await prisma.invoice.findMany({
    where: { tenantId, type: "INVOICE", isDeleted: false },
    select: {
      id: true,
      number: true,
      status: true,
      total: true,
      issueDate: true,
      dueDate: true,
      paidAt: true,
      customerId: true,
      customer: { select: { name: true } },
    },
    orderBy: { issueDate: "desc" },
  });

  // 6 bulan terakhir
  const now = new Date();
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    months.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }
  const monthly = months.map((m) => ({ month: m, label: monthLabel(m), invoiced: 0, paid: 0 }));
  const byMonth = new Map(monthly.map((x) => [x.month, x]));

  let totalInvoiced = 0;
  let totalPaid = 0;

  for (const inv of invoices) {
    const total = parseFloat(inv.total.toString());
    totalInvoiced += total;
    const im = byMonth.get(monthKey(new Date(inv.issueDate)));
    if (im) im.invoiced += total;
    if (inv.status === "PAID") {
      totalPaid += total;
      const pm = byMonth.get(monthKey(new Date(inv.paidAt ?? inv.issueDate)));
      if (pm) pm.paid += total;
    }
  }

  // Rekap per klien
  const clients = new Map<
    string,
    { customerId: string | null; name: string; invoiced: number; paid: number; count: number }
  >();
  for (const inv of invoices) {
    const total = parseFloat(inv.total.toString());
    const key = inv.customerId ?? "none";
    let c = clients.get(key);
    if (!c) {
      c = {
        customerId: inv.customerId,
        name: inv.customer?.name ?? "Tanpa pelanggan",
        invoiced: 0,
        paid: 0,
        count: 0,
      };
      clients.set(key, c);
    }
    c.invoiced += total;
    c.count += 1;
    if (inv.status === "PAID") c.paid += total;
  }
  const clientRecap = [...clients.values()]
    .map((c) => ({ ...c, outstanding: c.invoiced - c.paid }))
    .sort((a, b) => b.outstanding - a.outstanding);

  // Aging piutang (SENT + OVERDUE)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const aging = [
    { key: "current", label: "Belum jatuh tempo", count: 0, total: 0 },
    { key: "d1_30", label: "Terlambat 1–30 hari", count: 0, total: 0 },
    { key: "d31_60", label: "Terlambat 31–60 hari", count: 0, total: 0 },
    { key: "d60", label: "Terlambat >60 hari", count: 0, total: 0 },
  ];
  const topOutstanding: ReportSummary["topOutstanding"] = [];

  for (const inv of invoices) {
    if (inv.status !== "SENT" && inv.status !== "OVERDUE") continue;
    const total = parseFloat(inv.total.toString());
    const due = new Date(inv.dueDate);
    due.setHours(0, 0, 0, 0);
    const days = Math.floor((today.getTime() - due.getTime()) / 86400000);
    const bucket = days <= 0 ? aging[0] : days <= 30 ? aging[1] : days <= 60 ? aging[2] : aging[3];
    bucket.count += 1;
    bucket.total += total;
    topOutstanding.push({
      id: inv.id,
      number: inv.number,
      customer: inv.customer?.name ?? "—",
      dueDate: due.toISOString(),
      daysOverdue: Math.max(days, 0),
      total,
    });
  }
  topOutstanding.sort((a, b) => b.total - a.total);

  return {
    totals: {
      invoiced: totalInvoiced,
      paid: totalPaid,
      outstanding: totalInvoiced - totalPaid,
      invoiceCount: invoices.length,
    },
    monthly,
    clientRecap,
    aging,
    topOutstanding: topOutstanding.slice(0, 10),
  };
}

function esc(value: unknown): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function day(d: Date | string | null): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export type ReportExportType = "invoices" | "payments";

export async function buildReportCsv(
  tenantId: string,
  type: ReportExportType
): Promise<{ filename: string; csv: string }> {
  const stamp = new Date().toISOString().slice(0, 10);

  if (type === "payments") {
    const payments = await prisma.payment.findMany({
      where: { tenantId },
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

    return { filename: `nombokin-payments-${stamp}.csv`, csv: [header.join(","), ...lines].join("\n") };
  }

  const invoices = await prisma.invoice.findMany({
    where: { tenantId, type: "INVOICE", isDeleted: false },
    include: { customer: { select: { name: true } } },
    orderBy: { issueDate: "desc" },
  });

  const header = ["number", "status", "customer", "issue_date", "due_date", "paid_at", "total"];
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

  return { filename: `nombokin-invoices-${stamp}.csv`, csv: [header.join(","), ...lines].join("\n") };
}
