import { NextRequest, NextResponse } from "next/server";
import { requireTier } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { saveUploadedImage } from "@/server/services/uploadService";

export async function POST(request: NextRequest) {
  const gate = await requireTier(request, "PRO");
  if (gate instanceof NextResponse) return gate;
  const { auth } = gate;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    let logoUrl: string;
    try {
      ({ url: logoUrl } = await saveUploadedImage(file, "logo"));
    } catch (validationErr) {
      const message = validationErr instanceof Error ? validationErr.message : "Invalid file";
      const status = message === "File not found" || message.startsWith("Unsupported") || message.startsWith("File is too large") ? 400 : 500;
      return NextResponse.json({ error: message }, { status });
    }

    // Update logoUrl di Tenant
    await prisma.tenant.update({
      where: { id: auth.tenantId },
      data: { logoUrl },
    });

    return NextResponse.json({ success: true, logoUrl });
  } catch (err) {
    console.error("[UploadLogo/POST]", err);
    return NextResponse.json({ error: "Failed to upload logo" }, { status: 500 });
  }
}
