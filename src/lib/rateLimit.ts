import { NextRequest, NextResponse } from "next/server";
import { redisIncrWithExpiry } from "@/server/redis";

interface RateLimitOptions {
  // Unik per endpoint, mis. "login"
  key: string;
  // Maksimal percobaan dalam satu jendela waktu
  limit: number;
  // Panjang jendela dalam detik
  windowSeconds: number;
}

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

// Kembalikan NextResponse 429 bila limit terlampaui, atau null bila boleh lanjut.
// Fail-open: bila Redis tidak tersedia, request tetap diizinkan.
export async function checkRateLimit(
  request: NextRequest,
  options: RateLimitOptions
): Promise<NextResponse | null> {
  const { key, limit, windowSeconds } = options;
  const count = await redisIncrWithExpiry(
    `ratelimit:${key}:${clientIp(request)}`,
    windowSeconds
  );

  if (count === null) return null;
  if (count > limit) {
    return NextResponse.json(
      { error: "Too many requests, please try again later" },
      { status: 429 }
    );
  }
  return null;
}
