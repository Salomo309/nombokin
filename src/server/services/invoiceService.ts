import { prisma } from "@/lib/prisma";
import { generateInvoiceNumber, generateShareToken } from "@/lib/utils";
import type { InvoiceInput } from "@/lib/validators";
import type { InvoiceStatus, InvoiceType } from "@prisma/client";

export interface InvoiceListFilter {
  type: InvoiceType;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ---- List invoices with filter + search + pagination ----
export async function listInvoices(
  tenantId: string,
  filter: InvoiceListFilter
) {
  const { type, status, search = "", page = 1, limit = 20 } = filter;
  const skip = (page - 1) * limit;

  const where = {
    tenantId,
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

  return { invoices, total, page, limit };
}

// ---- Get single invoice detail (tenant-scoped) ----
export async function getInvoiceDetail(tenantId: string, id: string) {
  return prisma.invoice.findFirst({
    where: { id, tenantId, isDeleted: false },
    include: {
      customer: true,
      items: { orderBy: { sortOrder: "asc" } },
      tenant: { include: { subscription: true } },
    },
  });
}

const FREE_TIER_LIMIT = 5;

// ---- Check monthly invoice limit ----
export async function checkInvoiceLimit(tenantId: string): Promise<{
  allowed: boolean;
  count: number;
  limit: number;
}> {
  const subscription = await prisma.subscription.findUnique({
    where: { tenantId },
  });

  const tier = subscription?.tier ?? "FREE";
  if (tier !== "FREE") {
    return { allowed: true, count: 0, limit: Infinity };
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Hitung semua invoice yang DIBUAT bulan ini (termasuk yang dihapus),
  // agar penghapusan tidak bisa dipakai untuk melampaui kuota bulanan.
  const count = await prisma.invoice.count({
    where: {
      tenantId,
      type: "INVOICE",
      createdAt: { gte: startOfMonth },
    },
  });

  return {
    allowed: count < FREE_TIER_LIMIT,
    count,
    limit: FREE_TIER_LIMIT,
  };
}

// ---- Get next invoice sequence number ----
export async function getNextSequenceNumber(tenantId: string): Promise<number> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const quoPrefix = `QUO-${year}-`;

  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      tenantId,
      OR: [
        { number: { startsWith: prefix } },
        { number: { startsWith: quoPrefix } },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: { number: true },
  });

  if (!lastInvoice) return 1;

  const parts = lastInvoice.number.split("-");
  const lastSeq = parseInt(parts[parts.length - 1] ?? "0", 10);
  return isNaN(lastSeq) ? 1 : lastSeq + 1;
}

// ---- Create invoice ----
export async function createInvoice(
  tenantId: string,
  input: InvoiceInput & { type: InvoiceType }
) {
  if (input.type === "INVOICE") {
    const limitCheck = await checkInvoiceLimit(tenantId);
    if (!limitCheck.allowed) {
      throw new Error("Free invoice limit reached");
    }
  }

  const seq = await getNextSequenceNumber(tenantId);
  const number = generateInvoiceNumber(input.type, seq);
  const shareToken = generateShareToken();

  // Calculate totals
  const subtotal = input.items.reduce(
    (sum, item) => sum + item.qty * item.unitPrice,
    0
  );
  const discountAmount = subtotal * (input.discountPercent / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (input.taxPercent / 100);
  const total = afterDiscount + taxAmount;

  // Resolve or create customer
  let customerId = input.customerId;
  if (!customerId && input.customerName) {
    const customer = await prisma.customer.create({
      data: {
        tenantId,
        name: input.customerName,
        company: input.customerCompany,
        email: input.customerEmail || undefined,
        whatsapp: input.customerWhatsapp,
      },
    });
    customerId = customer.id;
  }

  const invoice = await prisma.invoice.create({
    data: {
      tenantId,
      customerId,
      number,
      type: input.type,
      status: "DRAFT",
      issueDate: new Date(input.issueDate),
      dueDate: new Date(input.dueDate),
      subtotal,
      discountPercent: input.discountPercent,
      taxPercent: input.taxPercent,
      total,
      currency: "IDR",
      notes: input.notes,
      terms: input.terms,
      shareToken,
      items: {
        create: input.items.map((item, index) => ({
          description: item.description,
          qty: item.qty,
          unitPrice: item.unitPrice,
          total: item.qty * item.unitPrice,
          sortOrder: index,
        })),
      },
    },
    include: { items: true, customer: true },
  });

  return invoice;
}

// ---- Update invoice (only DRAFT can be edited) ----
export async function updateInvoice(
  invoiceId: string,
  tenantId: string,
  input: InvoiceInput
) {
  const existing = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId, isDeleted: false },
  });

  if (!existing) throw new Error("Invoice not found");
  if (existing.status !== "DRAFT")
    throw new Error("Sent or paid invoices cannot be edited");

  // Resolve or create customer (same as create)
  let customerId = input.customerId;
  if (!customerId && input.customerName) {
    const customer = await prisma.customer.create({
      data: {
        tenantId,
        name: input.customerName,
        company: input.customerCompany,
        email: input.customerEmail || undefined,
        whatsapp: input.customerWhatsapp,
      },
    });
    customerId = customer.id;
  }

  const subtotal = input.items.reduce(
    (sum, item) => sum + item.qty * item.unitPrice,
    0
  );
  const discountAmount = subtotal * (input.discountPercent / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (input.taxPercent / 100);
  const total = afterDiscount + taxAmount;

  // Delete old items and recreate
  await prisma.invoiceItem.deleteMany({ where: { invoiceId } });

  const invoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      customerId,
      issueDate: new Date(input.issueDate),
      dueDate: new Date(input.dueDate),
      subtotal,
      discountPercent: input.discountPercent,
      taxPercent: input.taxPercent,
      total,
      notes: input.notes,
      terms: input.terms,
      items: {
        create: input.items.map((item, index) => ({
          description: item.description,
          qty: item.qty,
          unitPrice: item.unitPrice,
          total: item.qty * item.unitPrice,
          sortOrder: index,
        })),
      },
    },
    include: { items: true, customer: true },
  });

  return invoice;
}

// ---- Soft delete ----
export async function softDeleteInvoice(
  invoiceId: string,
  tenantId: string
): Promise<void> {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId, isDeleted: false },
  });
  if (!invoice) throw new Error("Invoice not found");
  if (invoice.status === "PAID")
    throw new Error("Paid invoices cannot be deleted");

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { isDeleted: true },
  });
}

// ---- Manually update status ----
export async function updateInvoiceStatus(
  invoiceId: string,
  tenantId: string,
  status: InvoiceStatus
): Promise<void> {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId, isDeleted: false },
  });
  if (!invoice) throw new Error("Invoice not found");

  let paidAt = invoice.paidAt;
  if (status === "PAID" && !paidAt) {
    paidAt = new Date();
  } else if (status !== "PAID" && invoice.status === "PAID") {
    paidAt = null;
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status, paidAt },
  });
}

// ---- Mark as sent ----
export async function markInvoiceSent(
  invoiceId: string,
  tenantId: string
): Promise<void> {
  await prisma.invoice.updateMany({
    where: { id: invoiceId, tenantId, isDeleted: false, status: "DRAFT" },
    data: { status: "SENT" },
  });
}

// ---- Convert quotation to invoice ----
export async function convertQuotationToInvoice(
  quotationId: string,
  tenantId: string
) {
  const quotation = await prisma.invoice.findFirst({
    where: { id: quotationId, tenantId, type: "QUOTATION", isDeleted: false },
    include: { items: true },
  });

  if (!quotation) throw new Error("Quotation not found");

  const limitCheck = await checkInvoiceLimit(tenantId);
  if (!limitCheck.allowed) {
    throw new Error("Free invoice limit reached");
  }

  const seq = await getNextSequenceNumber(tenantId);
  const number = generateInvoiceNumber("INVOICE", seq);
  const shareToken = generateShareToken();

  const invoice = await prisma.invoice.create({
    data: {
      tenantId,
      customerId: quotation.customerId,
      number,
      type: "INVOICE",
      status: "DRAFT",
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      subtotal: quotation.subtotal,
      discountPercent: quotation.discountPercent,
      taxPercent: quotation.taxPercent,
      total: quotation.total,
      currency: quotation.currency,
      notes: quotation.notes,
      terms: quotation.terms,
      shareToken,
      items: {
        create: quotation.items.map((item) => ({
          description: item.description,
          qty: item.qty,
          unitPrice: item.unitPrice,
          total: item.total,
          sortOrder: item.sortOrder,
        })),
      },
    },
    include: { items: true, customer: true },
  });

  return invoice;
}

// ---- Update overdue statuses (background cron) ----
export async function updateOverdueInvoices(): Promise<number> {
  const result = await prisma.invoice.updateMany({
    where: {
      status: "SENT",
      dueDate: { lt: new Date() },
      isDeleted: false,
    },
    data: { status: "OVERDUE" },
  });
  return result.count;
}
