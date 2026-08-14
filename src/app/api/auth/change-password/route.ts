import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";
import { changePasswordSchema } from "@/lib/validators";
import { sendPasswordChangedEmail } from "@/lib/resend";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const passwordMatch = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Reset refreshToken agar sesi perangkat lain harus login ulang
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, refreshToken: null },
    });

    await sendPasswordChangedEmail({
      to: user.email,
      customerName: user.name,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Auth/ChangePassword]", err);
    return NextResponse.json(
      { error: "Something went wrong, please try again" },
      { status: 500 }
    );
  }
}
