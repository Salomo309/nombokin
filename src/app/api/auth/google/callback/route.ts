import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
} from "@/lib/auth";
import { slugify } from "@/lib/utils";

const OAUTH_STATE_COOKIE = "nombokin_oauth_state";

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

async function exchangeCode(code: string, redirectUri: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId ?? "",
      client_secret: clientSecret ?? "",
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status}`);
  }

  const data = (await res.json()) as { id_token?: string };

  if (!data.id_token) {
    throw new Error("No id_token in token response");
  }

  const infoRes = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${data.id_token}`
  );

  if (!infoRes.ok) {
    throw new Error("Failed to validate id_token");
  }

  return (await infoRes.json()) as GoogleUserInfo;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const loginUrl = new URL("/login", request.url);

  if (error) {
    loginUrl.searchParams.set("error", "google_auth_failed");
    return NextResponse.redirect(loginUrl);
  }

  if (!code || !state) {
    loginUrl.searchParams.set("error", "google_auth_failed");
    return NextResponse.redirect(loginUrl);
  }

  const storedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  if (!storedState || storedState !== state) {
    loginUrl.searchParams.set("error", "google_state_mismatch");
    return NextResponse.redirect(loginUrl);
  }

  const redirectUri = `${new URL(request.url).origin}/api/auth/google/callback`;

  try {
    const info = await exchangeCode(code, redirectUri);

    if (!info.email || !info.email_verified) {
      loginUrl.searchParams.set("error", "google_email_unverified");
      return NextResponse.redirect(loginUrl);
    }

    const name = info.name?.trim() || info.email.split("@")[0];
    const email = info.email.toLowerCase();

    // Find existing user by googleId, then by email
    let user = await prisma.user.findUnique({ where: { googleId: info.sub } });

    if (!user) {
      user = await prisma.user.findUnique({ where: { email } });
    }

    let tenantId = user?.tenantId;

    if (!user) {
      // Create new tenant + user (Google email is pre-verified)
      const baseSlug = slugify(name) || "business";
      let slug = baseSlug;
      const existingSlug = await prisma.tenant.findUnique({ where: { slug } });
      if (existingSlug) {
        slug = `${baseSlug}-${Date.now().toString(36)}`;
      }

      const result = await prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
          data: { name, slug },
        });

        const newUser = await tx.user.create({
          data: {
            tenantId: tenant.id,
            email,
            name,
            role: "OWNER",
            googleId: info.sub,
            emailVerifiedAt: new Date(),
          },
        });

        await tx.subscription.create({
          data: { tenantId: tenant.id, tier: "FREE", status: "ACTIVE" },
        });

        return { user: newUser, tenant };
      });

      user = result.user;
      tenantId = result.tenant.id;
    } else if (!user.googleId) {
      // Link existing password account to Google
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: info.sub },
      });
    }

    if (!tenantId) {
      loginUrl.searchParams.set("error", "google_auth_failed");
      return NextResponse.redirect(loginUrl);
    }

    const accessToken = await signAccessToken({
      userId: user.id,
      tenantId,
      email: user.email,
      role: user.role,
    });
    const refreshToken = await signRefreshToken(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    const response = NextResponse.redirect(
      new URL("/dashboard", request.url)
    );
    await setAuthCookies(response, accessToken, refreshToken);

    return response;
  } catch (err) {
    console.error("[Auth/Google/Callback]", err);
    loginUrl.searchParams.set("error", "google_auth_failed");
    return NextResponse.redirect(loginUrl);
  }
}
