import { prisma } from "@/lib/prisma";
import type { PaymentMethodInput } from "@/lib/validators";
import type { PaymentMethodPatchInput } from "@/lib/validators";

// Pola acuan: route hanya validasi ringan + gate + delegasi.

export async function listPaymentMethods(tenantId: string) {
  return prisma.paymentMethod.findMany({
    where: { tenantId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function createPaymentMethod(
  tenantId: string,
  input: PaymentMethodInput
) {
  return prisma.paymentMethod.create({
    data: {
      tenantId,
      type: input.type,
      bankName: input.bankName || null,
      accountNumber: input.accountNumber || null,
      accountHolder: input.accountHolder || null,
      qrisImageUrl: input.qrisImageUrl || null,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? 0,
    },
  });
}

export async function updatePaymentMethod(
  tenantId: string,
  id: string,
  input: PaymentMethodPatchInput
) {
  const existing = await prisma.paymentMethod.findFirst({
    where: { id, tenantId },
  });
  if (!existing) return null;

  return prisma.paymentMethod.update({
    where: { id },
    data: {
      ...(input.bankName !== undefined ? { bankName: input.bankName || null } : {}),
      ...(input.accountNumber !== undefined ? { accountNumber: input.accountNumber || null } : {}),
      ...(input.accountHolder !== undefined ? { accountHolder: input.accountHolder || null } : {}),
      ...(input.qrisImageUrl !== undefined ? { qrisImageUrl: input.qrisImageUrl || null } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    },
  });
}

export async function deletePaymentMethod(
  tenantId: string,
  id: string
): Promise<boolean> {
  const deleted = await prisma.paymentMethod.deleteMany({
    where: { id, tenantId },
  });
  return deleted.count > 0;
}
