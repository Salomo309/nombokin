import { NextRequest, NextResponse } from "next/server";
import { requireTier } from "@/lib/guards";
import { buildReportCsv, type ReportExportType } from "@/server/services/reportService";

// GET /api/reports/export?type=invoices|payments — unduh CSV (BISNIS only)
export async function GET(request: NextRequest) {
  const gate = await requireTier(request, "BUSINESS");
  if (gate instanceof NextResponse) return gate;

  const raw = request.nextUrl.searchParams.get("type") ?? "invoices";
  const type: ReportExportType = raw === "payments" ? "payments" : "invoices";

  const { filename, csv } = await buildReportCsv(gate.auth.tenantId, type);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
