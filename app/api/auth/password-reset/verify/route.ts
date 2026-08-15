import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  addResetMinutes,
  generatePasswordResetToken,
  hashPasswordResetToken,
  passwordResetOtpMatches,
  PASSWORD_RESET_MAX_ATTEMPTS,
  PASSWORD_RESET_TOKEN_TTL_MINUTES,
} from "@/lib/password-reset-otp";
import { verifyPasswordResetOtpSchema } from "@/lib/password-reset-validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = verifyPasswordResetOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Enter the verification code." },
        { status: 400 }
      );
    }

    const { requestId, code } = parsed.data;
    const pending = await prisma.passwordResetRequest.findUnique({
      where: { id: requestId },
    });

    if (!pending || pending.usedAt) {
      return NextResponse.json(
        { error: "This password reset request is no longer available." },
        { status: 404 }
      );
    }

    const now = new Date();

    if (pending.expiresAt <= now) {
      await prisma.passwordResetRequest.delete({ where: { id: pending.id } });
      return NextResponse.json(
        { error: "This password reset session expired. Please start again." },
        { status: 410 }
      );
    }

    if (pending.otpExpiresAt <= now) {
      return NextResponse.json(
        { error: "This reset code expired. Request a new code." },
        { status: 410 }
      );
    }

    if (pending.otpAttempts >= PASSWORD_RESET_MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "Too many incorrect attempts. Request a new reset code." },
        { status: 429 }
      );
    }

    if (!passwordResetOtpMatches(pending.id, code, pending.otpHash)) {
      const updated = await prisma.passwordResetRequest.update({
        where: { id: pending.id },
        data: { otpAttempts: { increment: 1 } },
        select: { otpAttempts: true },
      });

      const attemptsRemaining = Math.max(
        0,
        PASSWORD_RESET_MAX_ATTEMPTS - updated.otpAttempts
      );

      return NextResponse.json(
        {
          error:
            attemptsRemaining > 0
              ? `Incorrect code. ${attemptsRemaining} attempt${attemptsRemaining === 1 ? "" : "s"} remaining.`
              : "Too many incorrect attempts. Request a new reset code.",
          attemptsRemaining,
        },
        { status: attemptsRemaining === 0 ? 429 : 400 }
      );
    }

    const resetToken = generatePasswordResetToken();
    const resetTokenHash = hashPasswordResetToken(resetToken);
    const resetTokenExpiresAt = addResetMinutes(
      now,
      PASSWORD_RESET_TOKEN_TTL_MINUTES
    );

    await prisma.passwordResetRequest.update({
      where: { id: pending.id },
      data: {
        verifiedAt: now,
        resetTokenHash,
        resetTokenExpiresAt,
        otpAttempts: 0,
      },
    });

    const response = NextResponse.json({
      message: "Verification successful. You can now choose a new password.",
      requestId: pending.id,
    });

    response.cookies.set({
      name: "gupto_password_reset",
      value: resetToken,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: PASSWORD_RESET_TOKEN_TTL_MINUTES * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Verify password reset OTP error:", error);
    return NextResponse.json(
      { error: "Unable to verify the reset code right now." },
      { status: 500 }
    );
  }
}
