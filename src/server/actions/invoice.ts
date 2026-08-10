"use server";

import { getAuthFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createInvoice,
  updateInvoice,
  softDeleteInvoice,
  convertQuotationToInvoice,
  getNextSequenceNumber,
} from "@/server/services/invoiceService";
import { invoiceSchema, type InvoiceInput } from "@/lib/validators";
import { generateInvoiceNumber, generateShareToken } from "@/lib/utils";
import type { InvoiceType } from "@prisma/client";

export async function createInvoiceAction(input: InvoiceInput & { type: InvoiceType }) {
  const auth = await getAuthFromCookies();
  if (!auth) throw new Error("Tidak terautentikasi");

  const parsed = invoiceSchema.safeParse(input);
  if (!parsed.success) throw new Error("Data tidak valid");

  return createInvoice(auth.tenantId, input);
}

export async function updateInvoiceAction(id: string, input: InvoiceInput) {
  const auth = await getAuthFromCookies();
  if (!auth) throw new Error("Tidak terautentikasi");

  const parsed = invoiceSchema.safeParse(input);
  if (!parsed.success) throw new Error("Data tidak valid");

  return updateInvoice(id, auth.tenantId, input);
}

export async function softDeleteInvoiceAction(id: string) {
  const auth = await getAuthFromCookies();
  if (!auth) throw new Error("Tidak terautentikasi");

  return softDeleteInvoice(id, auth.tenantId);
}

export async function duplicateInvoiceAction(id: string) {
  const auth = await getAuthFromCookies();
  if (!auth) throw new Error("Tidak terautentikasi");

  const existing = await prisma.invoice.findFirst({
    where: { id, tenantId: auth.tenantId, isDeleted: false },
    include: { items: true },
  });

  if (!existing) throw new Error("Invoice tidak ditemukan");

  const seq = await getNextSequenceNumber(auth.tenantId);
  const number = generateInvoiceNumber(existing.type, seq);
  const shareToken = generateShareToken();

  return prisma.invoice.create({
    data: {
      tenantId: auth.tenantId,
      customerId: existing.customerId,
      number,
      type: existing.type,
      status: "DRAFT",
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      subtotal: existing.subtotal,
      discountPercent: existing.discountPercent,
      taxPercent: existing.taxPercent,
      total: existing.total,
      currency: existing.currency,
      notes: existing.notes,
      terms: existing.terms,
      shareToken,
      items: {
        create: existing.items.map((item) => ({
          description: item.description,
          qty: item.qty,
          unitPrice: item.unitPrice,
          total: item.total,
          sortOrder: item.sortOrder,
        })),
      },
    },
  });
}

export async function convertQuotationToInvoiceAction(id: string) {
  const auth = await getAuthFromCookies();
  if (!auth) throw new Error("Tidak terautentikasi");

  return convertQuotationToInvoice(id, auth.tenantId);
}
