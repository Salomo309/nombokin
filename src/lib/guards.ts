import { NextRequest, NextResponse } from "next/server";
import {
  getAuthFromCookies,
  getAuthFromRequest,
  type JWTPayload,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type Tier = "FREE" | "PRO" | "BUSINESS";

const TIER_RANK: Record<Tier, number> = { FREE: 0, PRO: 1, BUSINESS: 2 };

// Bandingkan tier tenant dengan minimum. 0 = sama, >0 = di atas, <0 = di bawah.
export function compareTier(tier: Tier, minTier: Tier): number {
  return TIER_RANK[tier] - TIER_RANK[minTier];
}

export interface GatePass {
  auth: JWTPayload;
  tier: Tier;
}

// ---- API route guards (kembalikan NextResponse bila gagal) ----

// Auth saja: 401 bila tanpa sesi.
export async function requireAuth(
  request: NextRequest
): Promise<JWTPayload | NextResponse> {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return auth;
}

// Auth + tier minimum: 401 tanpa sesi, 403 bila tier kurang.
export async function requireTier(
  request: NextRequest,
  minTier: Exclude<Tier, "FREE">
): Promise<GatePass | NextResponse> {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { tenantId: auth.tenantId },
    select: { tier: true },
  });
  const tier = (subscription?.tier ?? "FREE") as Tier;

  if (TIER_RANK[tier] < TIER_RANK[minTier]) {
    const need = minTier === "BUSINESS" ? "BUSINESS" : "PRO";
    return NextResponse.json(
      { error: `This feature requires a ${need} subscription` },
      { status: 403 }
    );
  }

  return { auth, tier };
}

// Auth + role: 401 tanpa sesi, 403 bila role tidak diizinkan.
export async function requireRole(
  request: NextRequest,
  allowed: string[]
): Promise<JWTPayload | NextResponse> {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!allowed.includes(auth.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }
  return auth;
}

// Tier tenant tanpa memblokir (untuk logika yang butuh cabang, bukan gate).
export async function getTenantTier(tenantId: string): Promise<Tier> {
  const subscription = await prisma.subscription.findUnique({
    where: { tenantId },
    select: { tier: true },
  });
  return (subscription?.tier ?? "FREE") as Tier;
}

// ---- Server action guards (lempar Error bila gagal) ----

export async function assertTierAction(
  minTier: Exclude<Tier, "FREE">
): Promise<GatePass> {
  const auth = await getAuthFromCookies();
  if (!auth) throw new Error("Not authenticated");

  const subscription = await prisma.subscription.findUnique({
    where: { tenantId: auth.tenantId },
    select: { tier: true },
  });
  const tier = (subscription?.tier ?? "FREE") as Tier;

  if (TIER_RANK[tier] < TIER_RANK[minTier]) {
    const need = minTier === "BUSINESS" ? "BUSINESS" : "PRO";
    throw new Error(`This feature requires a ${need} subscription`);
  }

  return { auth, tier };
}
