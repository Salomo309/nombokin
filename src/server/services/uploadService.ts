import { randomBytes } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const DEFAULT_MAX_SIZE = 2 * 1024 * 1024; // 2MB

// SVG ditolak (risiko XSS bila diakses langsung); ekstensi diambil dari MIME tervalidasi.
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export interface SavedUpload {
  url: string;
}

// Validasi ukuran + tipe, simpan ke public/uploads dengan nama acak.
// Melempar Error dengan pesan English bila tidak valid (route menerjemahkan ke status).
export async function saveUploadedImage(
  file: File | null,
  prefix: "logo" | "qris"
): Promise<SavedUpload> {
  if (!file) {
    throw new Error("File not found");
  }

  const maxUploadSize = process.env.MAX_UPLOAD_SIZE
    ? parseInt(process.env.MAX_UPLOAD_SIZE, 10)
    : DEFAULT_MAX_SIZE;

  if (file.size > maxUploadSize) {
    throw new Error(`File is too large. Maximum ${maxUploadSize / (1024 * 1024)}MB`);
  }

  const allowedExt = ALLOWED_TYPES[file.type];
  if (!allowedExt) {
    throw new Error("Unsupported file format. Use JPG, PNG, or WEBP");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  // Nama file acak — ekstensi dari MIME tervalidasi, bukan nama asli (cegah double-extension)
  const fileName = `${prefix}-${randomBytes(16).toString("hex")}.${allowedExt}`;
  await writeFile(join(uploadDir, fileName), buffer);

  return { url: `/uploads/${fileName}` };
}
