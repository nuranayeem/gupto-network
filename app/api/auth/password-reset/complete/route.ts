import { hash } from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPasswordResetToken } from "@/lib/password-reset-otp";
import { completePasswordResetSchema } from "@/lib/password-reset-validation";

class ResetStateChangedError extends Error {}

function clearResetCookie(response: NextResponse) {
  response.cookies.set({
    name: "gupto_password_reset",
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = completePasswordResetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || "Enter a valid new password.",
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const resetToken = cookieStore.get("gupto_password_reset")?.value;

    if (!resetToken) {
      return NextResponse.json(
        { error: "Your verified reset session is missing. Please start again." },
        { status: 401 }
      );
    }

    const resetTokenHash = hashPasswordResetToken(resetToken);
    const now = new Date();
    const pending = await prisma.passwordResetRequest.findUnique({
      where: { id: parsed.data.requestId },
    });

    if (
      !pending ||
      pending.usedAt ||
      !pending.verifiedAt ||
      !pending.resetTokenHash ||
      pending.resetTokenHash !== resetTokenHash ||
      !pending.resetTokenExpiresAt ||
      pending.resetTokenExpiresAt <= now ||
      pending.expiresAt <= now
    ) {
      const response = NextResponse.json(
        { error: "This verified reset session expired or is no longer valid." },
        { status: 410 }
      );
      clearResetCookie(response);
      return response;
    }

    const passwordHash = await hash(parsed.data.password, 12);

    await prisma.$transaction(async (tx) => {
      const current = await tx.passwordResetRequest.findUnique({
        where: { id: pending.id },
      });

      const checkTime = new Date();

      if (
        !current ||
        current.usedAt ||
        !current.verifiedAt ||
        current.resetTokenHash !== resetTokenHash ||
        !current.resetTokenExpiresAt ||
        current.resetTokenExpiresAt <= checkTime ||
        current.expiresAt <= checkTime
      ) {
        throw new ResetStateChangedError();
      }

      await tx.user.update({
        where: { id: current.userId },
        data: { passwordHash },
      });

      await tx.passwordResetRequest.update({
        where: { id: current.id },
        data: {
          usedAt: checkTime,
          resetTokenHash: null,
          resetTokenExpiresAt: null,
        },
      });

      await tx.passwordResetRequest.deleteMany({
        where: {
          userId: current.userId,
          id: { not: current.id },
        },
      });
    });

    const response = NextResponse.json({
      message: "Password updated successfully.",
    });
    clearResetCookie(response);
    return response;
  } catch (error) {
    if (error instanceof ResetStateChangedError) {
      return NextResponse.json(
        { error: "This reset session changed or expired. Please start again." },
        { status: 409 }
      );
    }

    console.error("Complete password reset error:", error);
    return NextResponse.json(
      { error: "Unable to update your password right now." },
      { status: 500 }
    );
  }
}
