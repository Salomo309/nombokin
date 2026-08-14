import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const DEFAULT_MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 400 });
    }

    // Ambil batas ukuran upload dari env
    const maxUploadSize = process.env.MAX_UPLOAD_SIZE
      ? parseInt(process.env.MAX_UPLOAD_SIZE, 10)
      : DEFAULT_MAX_SIZE;

    if (file.size > maxUploadSize) {
      return NextResponse.json(
        { error: `File is too large. Maximum ${maxUploadSize / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file format. Use JPG, PNG, WEBP, or SVG" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Folder tujuan upload
    const uploadDir = join(process.cwd(), "public", "uploads");

    // Pastikan folder exist
    await mkdir(uploadDir, { recursive: true });

    // Buat nama file unik
    const fileExt = file.name.split(".").pop();
    const fileName = `${auth.tenantId}-${Date.now()}.${fileExt}`;
    const filePath = join(uploadDir, fileName);

    // Tulis file
    await writeFile(filePath, buffer);

    const logoUrl = `/uploads/${fileName}`;

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
