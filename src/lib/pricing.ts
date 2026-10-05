import { formatRupiah } from "@/lib/utils";

export type PaidTier = "PRO" | "BUSINESS";
export type BillingInterval = "MONTHLY" | "YEARLY";

// Satu-satunya sumber kebenaran harga paket (rupiah).
// Dipakai landing page, halaman langganan, dan route upgrade (server).
export const PRICING: Record<PaidTier, Record<BillingInterval, number>> = {
  PRO: { MONTHLY: 29000, YEARLY: 299000 },
  BUSINESS: { MONTHLY: 59000, YEARLY: 599000 },
};

export function getPrice(tier: PaidTier, interval: BillingInterval): number {
  return PRICING[tier][interval];
}

export function formatPrice(amount: number): string {
  return formatRupiah(amount);
}

// Label interval untuk Midtrans order_id: SUB-{tier}-{M|Y}-...
export function intervalShort(interval: BillingInterval): "M" | "Y" {
  return interval === "MONTHLY" ? "M" : "Y";
}
