import { prisma } from "@/lib/prisma";
import { sendPasswordResetOtp } from "@/lib/password-reset-email";
import {
  addResetMinutes,
  addResetSeconds,
  generatePasswordResetOtp,
  hashPasswordResetOtp,
  PASSWORD_RESET_MAX_RESENDS,
  PASSWORD_RESET_OTP_TTL_MINUTES,
  PASSWORD_RESET_RESEND_COOLDOWN_SECONDS,
  resetSecondsUntil,
} from "@/lib/password-reset-otp";
import { passwordResetRequestSchema } from "@/lib/password-reset-validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = passwordResetRequestSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: "Password reset request is missing." }, { status: 400 });
    }

    const pending = await prisma.passwordResetRequest.findUnique({
      where: { id: parsed.data.requestId },
    });

    if (!pending || pending.usedAt) {
      return Response.json(
        { error: "This password reset request is no longer available." },
        { status: 404 }
      );
    }

    const now = new Date();

    if (pending.expiresAt <= now) {
      await prisma.passwordResetRequest.delete({ where: { id: pending.id } });
      return Response.json(
        { error: "This password reset session expired. Please start again." },
        { status: 410 }
      );
    }

    const resendAvailableAt = addResetSeconds(
      pending.lastOtpSentAt,
      PASSWORD_RESET_RESEND_COOLDOWN_SECONDS
    );

    if (resendAvailableAt > now) {
      return Response.json(
        {
          error: "Please wait before requesting another code.",
          retryAfterSeconds: resetSecondsUntil(resendAvailableAt),
        },
        { status: 429 }
      );
    }

    if (pending.otpResendCount >= PASSWORD_RESET_MAX_RESENDS) {
      return Response.json(
        { error: "You have reached the reset-code resend limit. Please start again later." },
        { status: 429 }
      );
    }

    const code = generatePasswordResetOtp();
    const otpHash = hashPasswordResetOtp(pending.id, code);
    const otpExpiresAt = addResetMinutes(now, PASSWORD_RESET_OTP_TTL_MINUTES);

    await prisma.passwordResetRequest.update({
      where: { id: pending.id },
      data: {
        otpHash,
        otpExpiresAt,
        otpAttempts: 0,
        otpResendCount: { increment: 1 },
        lastOtpSentAt: now,
        verifiedAt: null,
        resetTokenHash: null,
        resetTokenExpiresAt: null,
      },
    });

    try {
      const delivery = await sendPasswordResetOtp({ to: pending.email, code });
      return Response.json({
        message:
          delivery.deliveryMode === "console"
            ? "A new local reset code was generated. Check the Next.js server terminal."
            : "A new password reset code was sent.",
        retryAfterSeconds: PASSWORD_RESET_RESEND_COOLDOWN_SECONDS,
      });
    } catch (error) {
      await prisma.passwordResetRequest.updateMany({
        where: { id: pending.id, otpHash },
        data: {
          otpHash: pending.otpHash,
          otpExpiresAt: pending.otpExpiresAt,
          otpAttempts: pending.otpAttempts,
          otpResendCount: pending.otpResendCount,
          lastOtpSentAt: pending.lastOtpSentAt,
          verifiedAt: pending.verifiedAt,
          resetTokenHash: pending.resetTokenHash,
          resetTokenExpiresAt: pending.resetTokenExpiresAt,
        },
      });

      console.error("Password reset resend delivery error:", error);
      return Response.json(
        { error: "We could not generate a new reset code. Please try again shortly." },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Password reset resend error:", error);
    return Response.json(
      { error: "Unable to resend the password reset code right now." },
      { status: 500 }
    );
  }
}
