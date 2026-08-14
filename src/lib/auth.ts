import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-dev-secret-change-in-production"
);
const JWT_REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET ?? "fallback-refresh-secret-change-in-production"
);

const ACCESS_TOKEN_EXPIRY = "60m";
const REFRESH_TOKEN_EXPIRY = "7d";
const ACCESS_COOKIE = "nombokin_access";
const REFRESH_COOKIE = "nombokin_refresh";
const ACCESS_COOKIE_MAX_AGE = 60 * 60; // 1 hour

export interface JWTPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
}

// ---- Token generation ----

export async function signAccessToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(JWT_REFRESH_SECRET);
}

// ---- Token verification ----

export async function verifyAccessToken(
  token: string
): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(
  token: string
): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET);
    return payload as unknown as { userId: string };
  } catch {
    return null;
  }
}

// ---- Cookie helpers ----

export async function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
): Promise<void> {
  const secure = (process.env.NEXT_PUBLIC_APP_URL ?? "").startsWith("https");
  response.cookies.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: ACCESS_COOKIE_MAX_AGE,
    path: "/",
  });
  response.cookies.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/api/auth",
  });
}

export async function clearAuthCookies(response: NextResponse): Promise<void> {
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
}

// ---- Get current user from request ----

export async function getAuthFromRequest(
  request: NextRequest
): Promise<JWTPayload | null> {
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  return verifyAccessToken(token);
}

// ---- Get current user from server component ----

export async function getAuthFromCookies(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  return verifyAccessToken(token);
}

export { ACCESS_COOKIE, REFRESH_COOKIE };
