import { prisma } from "@/lib/prisma";
import { generateInvoiceNumber, generateShareToken } from "@/lib/utils";
import type { InvoiceInput } from "@/lib/validators";
import type { InvoiceStatus, InvoiceType } from "@prisma/client";

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

  const count = await prisma.invoice.count({
    where: {
      tenantId,
      isDeleted: false,
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

  if (!existing) throw new Error("Invoice tidak ditemukan");
  if (existing.status !== "DRAFT")
    throw new Error("Invoice yang sudah dikirim atau lunas tidak dapat diedit");

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
      customerId: input.customerId,
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
  if (!invoice) throw new Error("Invoice tidak ditemukan");
  if (invoice.status === "PAID")
    throw new Error("Invoice yang sudah lunas tidak dapat dihapus");

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { isDeleted: true },
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

  if (!quotation) throw new Error("Penawaran tidak ditemukan");

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
