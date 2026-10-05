import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getAuthFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const DEFAULT_MAX_SIZE = 2 * 1024 * 1024; // 2MB

// Ekstensi diambil dari MIME tervalidasi, bukan nama asli (cegah double-extension).
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// POST /api/upload/qris — unggah gambar QRIS sendiri (semua tier boleh)
export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 400 });
    }

    const maxUploadSize = process.env.MAX_UPLOAD_SIZE
      ? parseInt(process.env.MAX_UPLOAD_SIZE, 10)
      : DEFAULT_MAX_SIZE;

    if (file.size > maxUploadSize) {
      return NextResponse.json(
        { error: `File is too large. Maximum ${maxUploadSize / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    const allowedExt = ALLOWED_TYPES[file.type];
    if (!allowedExt) {
      return NextResponse.json(
        { error: "Unsupported file format. Use JPG, PNG, or WEBP" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    // Nama file acak — ekstensi dari MIME tervalidasi, bukan nama asli
    const fileName = `qris-${randomBytes(16).toString("hex")}.${allowedExt}`;
    await writeFile(join(uploadDir, fileName), buffer);

    return NextResponse.json({ success: true, url: `/uploads/${fileName}` });
  } catch (err) {
    console.error("[UploadQris/POST]", err);
    return NextResponse.json({ error: "Failed to upload QRIS image" }, { status: 500 });
  }
}
