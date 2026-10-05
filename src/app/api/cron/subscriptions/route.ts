import { NextRequest, NextResponse } from "next/server";
import { sweepExpiredSubscriptions } from "@/server/services/subscriptionService";

// GET /api/cron/subscriptions — sapu subscription kedaluwarsa (dipanggil crontab VPS).
// Proteksi: Authorization: Bearer <CRON_SECRET>. Idempoten, aman di-run berulang.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Cron is not configured" }, { status: 503 });
  }

  const header = request.headers.get("authorization") ?? "";
  if (header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const result = await sweepExpiredSubscriptions();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[CronSubscriptions/GET]", err);
    return NextResponse.json({ error: "Sweep failed" }, { status: 500 });
  }
}
