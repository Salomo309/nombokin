import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { saveUploadedImage } from "@/server/services/uploadService";

// POST /api/upload/qris — unggah gambar QRIS sendiri (semua tier boleh)
export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    try {
      const { url } = await saveUploadedImage(file, "qris");
      return NextResponse.json({ success: true, url });
    } catch (validationErr) {
      const message = validationErr instanceof Error ? validationErr.message : "Invalid file";
      const status = message === "File not found" || message.startsWith("Unsupported") || message.startsWith("File is too large") ? 400 : 500;
      return NextResponse.json({ error: message }, { status });
    }
  } catch (err) {
    console.error("[UploadQris/POST]", err);
    return NextResponse.json({ error: "Failed to upload QRIS image" }, { status: 500 });
  }
}
