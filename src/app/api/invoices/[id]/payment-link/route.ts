import { NextRequest, NextResponse } from "next/server";
import { requireTier } from "@/lib/guards";
import { createPaymentLink } from "@/server/services/paymentService";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const gate = await requireTier(request, "PRO");
  if (gate instanceof NextResponse) return gate;
  const { auth } = gate;

  try {
    const limited = await checkRateLimit(request, {
      key: "payment-link",
      limit: 30,
      windowSeconds: 60,
    });
    if (limited) return limited;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const paymentUrl = await createPaymentLink(id, auth.tenantId, appUrl);
    return NextResponse.json({ paymentUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create payment link";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
