import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPaymentLink } from "@/server/services/paymentService";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const limited = await checkRateLimit(request, {
    key: "payment-link",
    limit: 30,
    windowSeconds: 60,
  });
  if (limited) return limited;

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId: auth.tenantId },
    });

    if (!subscription || subscription.tier === "FREE") {
      return NextResponse.json(
        { error: "Online payment requires a PRO subscription" },
        { status: 403 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const paymentUrl = await createPaymentLink(id, auth.tenantId, appUrl);
    return NextResponse.json({ paymentUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create payment link";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
