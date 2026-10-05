"use server";

import { getAuthFromCookies } from "@/lib/auth";
import { getTenantTier } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateProfileAction(data: { name: string; email: string }) {
  const auth = await getAuthFromCookies();
  if (!auth) throw new Error("Not authenticated");

  // Validate fields
  if (!data.name || !data.email) throw new Error("Name and email are required");

  // Check if email already used by another user
  const existing = await prisma.user.findFirst({
    where: { email: data.email, id: { not: auth.userId } },
  });
  if (existing) throw new Error("Email is already used by another user");

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
  if (!auth) throw new Error("Not authenticated");

  if (!data.name) throw new Error("Business name is required");

  // Custom letterhead & watermark adalah fitur berbayar — paksa default untuk FREE
  const isPaidTier = (await getTenantTier(auth.tenantId)) !== "FREE";

  await prisma.tenant.update({
    where: { id: auth.tenantId },
    data: {
      name: data.name,
      letterheadSignature: isPaidTier ? data.letterheadSignature || null : null,
      watermarkText: isPaidTier
        ? data.watermarkText || "Dibuat dengan Nombokin"
        : "Dibuat dengan Nombokin",
    },
  });

  revalidatePath("/settings");
  return { success: true };
}
