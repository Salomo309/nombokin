"use server";

import { getAuthFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { customerSchema, type CustomerInput } from "@/lib/validators";

export async function createCustomerAction(input: CustomerInput) {
  const auth = await getAuthFromCookies();
  if (!auth) throw new Error("Tidak terautentikasi");

  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) throw new Error("Data tidak valid");

  return prisma.customer.create({
    data: {
      tenantId: auth.tenantId,
      name: parsed.data.name,
      company: parsed.data.company || null,
      email: parsed.data.email || null,
      whatsapp: parsed.data.whatsapp || null,
      notes: parsed.data.notes || null,
    },
  });
}

export async function updateCustomerAction(id: string, input: CustomerInput) {
  const auth = await getAuthFromCookies();
  if (!auth) throw new Error("Tidak terautentikasi");

  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) throw new Error("Data tidak valid");

  const existing = await prisma.customer.findFirst({
    where: { id, tenantId: auth.tenantId },
  });
  if (!existing) throw new Error("Pelanggan tidak ditemukan");

  return prisma.customer.update({
    where: { id },
    data: {
      name: parsed.data.name,
      company: parsed.data.company || null,
      email: parsed.data.email || null,
      whatsapp: parsed.data.whatsapp || null,
      notes: parsed.data.notes || null,
    },
  });
}

export async function deleteCustomerAction(id: string) {
  const auth = await getAuthFromCookies();
  if (!auth) throw new Error("Tidak terautentikasi");

  const existing = await prisma.customer.findFirst({
    where: { id, tenantId: auth.tenantId },
  });
  if (!existing) throw new Error("Pelanggan tidak ditemukan");

  return prisma.customer.delete({
    where: { id },
  });
}
