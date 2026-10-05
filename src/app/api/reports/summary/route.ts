import { NextRequest, NextResponse } from "next/server";
import { requireTier } from "@/lib/guards";
import { getReportSummary } from "@/server/services/reportService";

// GET /api/reports/summary — rekap pendapatan, per klien & aging piutang (BISNIS only)
export async function GET(request: NextRequest) {
  const gate = await requireTier(request, "BUSINESS");
  if (gate instanceof NextResponse) return gate;

  const summary = await getReportSummary(gate.auth.tenantId);
  return NextResponse.json(summary);
}
