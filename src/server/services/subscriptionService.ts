import { prisma } from "@/lib/prisma";
import { createSnapTransaction, IS_PRODUCTION, MIDTRANS_CLIENT_KEY } from "@/lib/midtrans";
import { generateShareToken } from "@/lib/utils";
import { getPrice, intervalShort, type BillingInterval, type PaidTier } from "@/lib/pricing";

export type DowngradeTier = "FREE" | "PRO";

// Suspend hanya MEMBER (OWNER dan ADMIN dikecualikan — keputusan produk).
const SUSPENDABLE_ROLES = ["MEMBER"] as const;

// ---- Buat order upgrade: transaksi Snap + payment PENDING ----
export interface UpgradeOrderInput {
  tenantId: string;
  userId: string;
  tier: PaidTier;
  interval: BillingInterval;
  customerName: string;
  customerEmail?: string;
}

export interface UpgradeOrder {
  orderId: string;
  token: string;
  redirectUrl: string;
  snapScriptUrl: string;
  clientKey: string;
}

export async function createUpgradeOrder(input: UpgradeOrderInput): Promise<UpgradeOrder> {
  const { tenantId, userId, tier, interval } = input;
  const price = getPrice(tier, interval);

  // Midtrans order_id max 50 chars — keep it short and unique.
  // Format: SUB-{tier}-{M|Y}-{tenantId}-{token}
  const orderId = `SUB-${tier}-${intervalShort(interval)}-${tenantId}-${generateShareToken()
    .replace(/[-_]/g, "")
    .slice(0, 8)}`;

  const snapResponse = await createSnapTransaction({
    orderId,
    grossAmount: price,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    invoiceNumber: orderId,
    items: [
      {
        id: `${tier}-${interval}`,
        name: `Langganan Nombokin ${tier} (${interval === "MONTHLY" ? "Bulanan" : "Tahunan"})`,
        price,
        quantity: 1,
      },
    ],
  });

  // Record pending subscription payment in history
  await prisma.payment.create({
    data: {
      tenantId,
      userId,
      orderId,
      type: "SUBSCRIPTION",
      status: "PENDING",
      amount: price,
      tier,
      interval,
      description: `Langganan ${tier} (${interval === "MONTHLY" ? "Bulanan" : "Tahunan"})`,
    },
  });

  const snapHost = IS_PRODUCTION ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com";

  return {
    orderId,
    token: snapResponse.token,
    redirectUrl: snapResponse.redirect_url,
    snapScriptUrl: `${snapHost}/snap/snap.js`,
    clientKey: MIDTRANS_CLIENT_KEY,
  };
}

// ---- Batalkan payment PENDING milik tenant (user menutup popup Snap) ----
export async function cancelPendingPayment(
  tenantId: string,
  orderId: string
): Promise<boolean> {
  const payment = await prisma.payment.findFirst({
    where: { orderId, tenantId },
  });

  if (!payment) return false;

  if (payment.status === "PENDING") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "CANCELLED" },
    });
  }

  return true;
}

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
