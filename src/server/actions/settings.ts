"use server";

import { getAuthFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateProfileAction(data: { name: string; email: string }) {
  const auth = await getAuthFromCookies();
  if (!auth) throw new Error("Tidak terautentikasi");

  // Validate fields
  if (!data.name || !data.email) throw new Error("Nama dan email wajib diisi");

  // Check if email already used by another user
  const existing = await prisma.user.findFirst({
    where: { email: data.email, id: { not: auth.userId } },
  });
  if (existing) throw new Error("Email sudah digunakan oleh pengguna lain");

  await prisma.user.update({
    where: { id: auth.userId },
    data: { name: data.name, email: data.email },
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function updateCompanyAction(data: {
  name: string;
  letterheadSignature?: string;
  watermarkText?: string;
}) {
  const auth = await getAuthFromCookies();
  if (!auth) throw new Error("Tidak terautentikasi");

  if (!data.name) throw new Error("Nama bisnis wajib diisi");

  await prisma.tenant.update({
    where: { id: auth.tenantId },
    data: {
      name: data.name,
      letterheadSignature: data.letterheadSignature || null,
      watermarkText: data.watermarkText || "Dibuat dengan Nombokin",
    },
  });

  revalidatePath("/settings");
  return { success: true };
}
