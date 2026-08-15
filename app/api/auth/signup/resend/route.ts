import { prisma } from "@/lib/prisma";
import { sendSignupOtpEmail, SignupEmailConfigurationError } from "@/lib/signup-email";
import {
  addMinutes,
  addSeconds,
  generateSignupOtp,
  hashSignupOtp,
  OTP_MAX_RESENDS,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_TTL_MINUTES,
  secondsUntil,
} from "@/lib/signup-otp";
import { resendSignupOtpSchema } from "@/lib/signup-validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resendSignupOtpSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Verification request is missing." },
        { status: 400 }
      );
    }

    const { requestId } = parsed.data;
    const pending = await prisma.pendingSignup.findUnique({
      where: { id: requestId },
    });

    if (!pending) {
      return Response.json(
        {
          error:
            "This verification request is no longer available. Please start signup again.",
        },
        { status: 404 }
      );
    }

    const now = new Date();

    if (pending.expiresAt <= now) {
      await prisma.pendingSignup.delete({ where: { id: pending.id } });

      return Response.json(
        {
          error: "This signup session expired. Please start signup again.",
        },
        { status: 410 }
      );
    }

    const resendAvailableAt = addSeconds(
      pending.lastOtpSentAt,
      OTP_RESEND_COOLDOWN_SECONDS
    );

    if (resendAvailableAt > now) {
      return Response.json(
        {
          error: "Please wait before requesting another code.",
          retryAfterSeconds: secondsUntil(resendAvailableAt),
        },
        { status: 429 }
      );
    }

    if (pending.otpResendCount >= OTP_MAX_RESENDS) {
      return Response.json(
        {
          error:
            "You have reached the resend limit. Please start signup again.",
        },
        { status: 429 }
      );
    }

    const code = generateSignupOtp();
    const otpHash = hashSignupOtp(pending.id, code);
    const otpExpiresAt = addMinutes(now, OTP_TTL_MINUTES);

    await prisma.pendingSignup.update({
      where: { id: pending.id },
      data: {
        otpHash,
        otpExpiresAt,
        otpAttempts: 0,
        otpResendCount: {
          increment: 1,
        },
        lastOtpSentAt: now,
      },
    });

    let deliveryMode: "console" | "resend";

    try {
      const delivery = await sendSignupOtpEmail({
        to: pending.email,
        code,
      });
      deliveryMode = delivery.deliveryMode;
    } catch (error) {
      // Restore the last valid verification state if the replacement email fails.
      await prisma.pendingSignup.updateMany({
        where: {
          id: pending.id,
          otpHash,
        },
        data: {
          otpHash: pending.otpHash,
          otpExpiresAt: pending.otpExpiresAt,
          otpAttempts: pending.otpAttempts,
          otpResendCount: pending.otpResendCount,
          lastOtpSentAt: pending.lastOtpSentAt,
        },
      });

      if (error instanceof SignupEmailConfigurationError) {
        console.error("Signup email configuration error:", error.message);
      } else {
        console.error("Signup OTP resend error:", error);
      }

      return Response.json(
        {
          error: "We could not send a new code. Please try again shortly.",
        },
        { status: 503 }
      );
    }

    return Response.json(
      {
        message:
          deliveryMode === "console"
            ? "A new local verification code was generated. Check the Next.js server terminal."
            : "A new verification code was sent.",
        retryAfterSeconds: OTP_RESEND_COOLDOWN_SECONDS,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Signup OTP resend route error:", error);

    return Response.json(
      {
        error: "Unable to resend the verification code right now.",
      },
      { status: 500 }
    );
  }
}
