import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { requireRole } from "@/lib/guards";
import { getTenantTier } from "@/lib/guards";
import { handleTenantDowngrade, type DowngradeTier } from "@/server/services/subscriptionService";

const TIER_RANK = { FREE: 0, PRO: 1, BUSINESS: 2 } as const;

// POST /api/billing/subscription/downgrade — OWNER turun tier (bekukan non-OWNER)
export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const roleGate = await requireRole(request, ["OWNER", "ADMIN"]);
  if (roleGate instanceof NextResponse) return roleGate;

  try {
    const body = await request.json();
    const targetTier = body?.tier as DowngradeTier | undefined;

    if (targetTier !== "FREE" && targetTier !== "PRO") {
      return NextResponse.json({ error: "Invalid target tier" }, { status: 400 });
    }

    const currentTier = await getTenantTier(auth.tenantId);
    if (TIER_RANK[targetTier] >= TIER_RANK[currentTier]) {
      return NextResponse.json(
        { error: "Target tier must be lower than current tier" },
        { status: 400 }
      );
    }

    await handleTenantDowngrade(auth.tenantId, targetTier);
    return NextResponse.json({ ok: true, tier: targetTier });
  } catch (err) {
    console.error("[BillingDowngrade/POST]", err);
    return NextResponse.json({ error: "Failed to downgrade subscription" }, { status: 500 });
  }
}
