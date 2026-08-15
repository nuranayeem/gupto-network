import { prisma } from "@/lib/prisma";
import {
  PasswordResetEmailConfigurationError,
  sendPasswordResetOtp,
} from "@/lib/password-reset-email";
import {
  addResetMinutes,
  addResetSeconds,
  generatePasswordResetOtp,
  hashPasswordResetOtp,
  PASSWORD_RESET_MAX_RESENDS,
  PASSWORD_RESET_OTP_TTL_MINUTES,
  PASSWORD_RESET_RESEND_COOLDOWN_SECONDS,
  PASSWORD_RESET_SESSION_TTL_MINUTES,
  resetSecondsUntil,
} from "@/lib/password-reset-otp";
import { startPasswordResetSchema } from "@/lib/password-reset-validation";

function deliveryFailure(error: unknown) {
  if (error instanceof PasswordResetEmailConfigurationError) {
    console.error("Password reset email configuration error:", error.message);
  } else {
    console.error("Password reset OTP delivery error:", error);
  }

  return Response.json(
    { error: "We could not send the reset code. Please try again shortly." },
    { status: 503 }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = startPasswordResetSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          error:
            parsed.error.flatten().fieldErrors.email?.[0] ||
            "Enter a valid Gmail address.",
        },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const now = new Date();

    await prisma.passwordResetRequest.deleteMany({
      where: {
        OR: [
          { expiresAt: { lte: now } },
          { usedAt: { not: null } },
        ],
      },
    });

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true },
    });

    if (!user?.passwordHash) {
      return Response.json(
        { error: "No Gupto account was found with that Gmail address." },
        { status: 404 }
      );
    }

    let existing = await prisma.passwordResetRequest.findFirst({
      where: {
        userId: user.id,
        expiresAt: { gt: now },
        usedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    if (existing?.verifiedAt) {
      await prisma.passwordResetRequest.delete({ where: { id: existing.id } });
      existing = null;
    }

    if (existing) {
      const resendAvailableAt = addResetSeconds(
        existing.lastOtpSentAt,
        PASSWORD_RESET_RESEND_COOLDOWN_SECONDS
      );

      if (resendAvailableAt > now) {
        return Response.json(
          {
            message: "A reset code was already generated. Use the newest code.",
            requestId: existing.id,
            retryAfterSeconds: resetSecondsUntil(resendAvailableAt),
          },
          { status: 202 }
        );
      }

      if (existing.otpResendCount >= PASSWORD_RESET_MAX_RESENDS) {
        return Response.json(
          {
            error:
              "Password reset resend limit reached. Please try again after this reset session expires.",
          },
          { status: 429 }
        );
      }

      const code = generatePasswordResetOtp();
      const otpHash = hashPasswordResetOtp(existing.id, code);
      const otpExpiresAt = addResetMinutes(now, PASSWORD_RESET_OTP_TTL_MINUTES);

      await prisma.passwordResetRequest.update({
        where: { id: existing.id },
        data: {
          otpHash,
          otpExpiresAt,
          otpAttempts: 0,
          otpResendCount: { increment: 1 },
          lastOtpSentAt: now,
          resetTokenHash: null,
          resetTokenExpiresAt: null,
        },
      });

      try {
        const delivery = await sendPasswordResetOtp({ to: email, code });
        return Response.json(
          {
            message:
              delivery.deliveryMode === "console"
                ? "A local password reset code was generated. Check the Next.js server terminal."
                : "A password reset code was sent.",
            requestId: existing.id,
            retryAfterSeconds: PASSWORD_RESET_RESEND_COOLDOWN_SECONDS,
          },
          { status: 202 }
        );
      } catch (error) {
        await prisma.passwordResetRequest.updateMany({
          where: { id: existing.id, otpHash },
          data: {
            otpHash: existing.otpHash,
            otpExpiresAt: existing.otpExpiresAt,
            otpAttempts: existing.otpAttempts,
            otpResendCount: existing.otpResendCount,
            lastOtpSentAt: existing.lastOtpSentAt,
            resetTokenHash: existing.resetTokenHash,
            resetTokenExpiresAt: existing.resetTokenExpiresAt,
          },
        });
        return deliveryFailure(error);
      }
    }

    const requestId = crypto.randomUUID();
    const code = generatePasswordResetOtp();
    const otpHash = hashPasswordResetOtp(requestId, code);
    const otpExpiresAt = addResetMinutes(now, PASSWORD_RESET_OTP_TTL_MINUTES);
    const expiresAt = addResetMinutes(now, PASSWORD_RESET_SESSION_TTL_MINUTES);

    await prisma.passwordResetRequest.create({
      data: {
        id: requestId,
        userId: user.id,
        email,
        otpHash,
        otpExpiresAt,
        expiresAt,
        otpAttempts: 0,
        otpResendCount: 0,
        lastOtpSentAt: now,
      },
    });

    try {
      const delivery = await sendPasswordResetOtp({ to: email, code });
      return Response.json(
        {
          message:
            delivery.deliveryMode === "console"
              ? "A local password reset code was generated. Check the Next.js server terminal."
              : "A password reset code was sent.",
          requestId,
          retryAfterSeconds: PASSWORD_RESET_RESEND_COOLDOWN_SECONDS,
        },
        { status: 202 }
      );
    } catch (error) {
      await prisma.passwordResetRequest.deleteMany({ where: { id: requestId } });
      return deliveryFailure(error);
    }
  } catch (error) {
    console.error("Start password reset error:", error);
    return Response.json(
      { error: "Unable to start password recovery right now." },
      { status: 500 }
    );
  }
}
