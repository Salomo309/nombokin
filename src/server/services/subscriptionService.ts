import { prisma } from "@/lib/prisma";

export type DowngradeTier = "FREE" | "PRO";

// Suspend hanya MEMBER (OWNER dan ADMIN dikecualikan — keputusan produk).
const SUSPENDABLE_ROLES = ["MEMBER"] as const;

// ---- Downgrade tenant: turunkan tier + bekukan anggota + hanguskan invite ----
export async function handleTenantDowngrade(
  tenantId: string,
  targetTier: DowngradeTier
): Promise<void> {
  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { tenantId },
      update: {
        tier: targetTier,
        status: "ACTIVE",
        currentPeriodEnd: targetTier === "FREE" ? null : undefined,
      },
      create: {
        tenantId,
        tier: targetTier,
        status: "ACTIVE",
      },
    }),
    prisma.user.updateMany({
      where: { tenantId, role: { in: [...SUSPENDABLE_ROLES] } },
      data: { status: "SUSPENDED" },
    }),
    prisma.inviteToken.deleteMany({ where: { tenantId } }),
  ]);

  console.log(`[Subscription] Tenant ${tenantId} downgraded to ${targetTier}, members suspended`);
}

// ---- Restore anggota saat re-upgrade ke BISNIS ----
export async function handleTenantRestore(tenantId: string): Promise<void> {
  const restored = await prisma.user.updateMany({
    where: { tenantId, status: "SUSPENDED" },
    data: { status: "ACTIVE" },
  });

  if (restored.count > 0) {
    console.log(`[Subscription] Tenant ${tenantId} restored ${restored.count} member(s)`);
  }
}

// ---- Sapu subscription kedaluwarsa + token invite kedaluwarsa (idempoten) ----
export async function sweepExpiredSubscriptions(): Promise<{
  downgraded: number;
  invitesCleaned: number;
}> {
  const now = new Date();
  let downgraded = 0;

  const expired = await prisma.subscription.findMany({
    where: { tier: { not: "FREE" }, status: "ACTIVE", currentPeriodEnd: { lt: now } },
    select: { tenantId: true },
  });

  for (const sub of expired) {
    try {
      await handleTenantDowngrade(sub.tenantId, "FREE");
      downgraded += 1;
    } catch (err) {
      console.error(`[Subscription] Sweep failed for tenant ${sub.tenantId}:`, err);
    }
  }

  const invites = await prisma.inviteToken.deleteMany({
    where: { expiresAt: { lt: now } },
  });

  return { downgraded, invitesCleaned: invites.count };
}
