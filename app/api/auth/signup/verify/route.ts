import { prisma } from "@/lib/prisma";
import {
  OTP_MAX_ATTEMPTS,
  signupOtpMatches,
} from "@/lib/signup-otp";
import { verifySignupOtpSchema } from "@/lib/signup-validation";

class VerificationStateChangedError extends Error {}

function isPrismaUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = verifySignupOtpSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          error:
            parsed.error.issues[0]?.message ||
            "Enter the 6-digit verification code.",
        },
        { status: 400 }
      );
    }

    const { requestId, code } = parsed.data;
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

    if (pending.otpExpiresAt <= now) {
      return Response.json(
        {
          error: "This verification code expired. Request a new code.",
          codeExpired: true,
        },
        { status: 410 }
      );
    }

    if (pending.otpAttempts >= OTP_MAX_ATTEMPTS) {
      return Response.json(
        {
          error:
            "Too many incorrect attempts. Request a new verification code.",
          attemptsExhausted: true,
        },
        { status: 429 }
      );
    }

    if (!signupOtpMatches(pending.id, code, pending.otpHash)) {
      const updatedPending = await prisma.pendingSignup.update({
        where: { id: pending.id },
        data: {
          otpAttempts: {
            increment: 1,
          },
        },
        select: {
          otpAttempts: true,
        },
      });

      const attemptsRemaining = Math.max(
        0,
        OTP_MAX_ATTEMPTS - updatedPending.otpAttempts
      );

      return Response.json(
        {
          error:
            attemptsRemaining > 0
              ? `Incorrect code. ${attemptsRemaining} attempt${
                  attemptsRemaining === 1 ? "" : "s"
                } remaining.`
              : "Too many incorrect attempts. Request a new verification code.",
          attemptsRemaining,
          attemptsExhausted: attemptsRemaining === 0,
        },
        { status: attemptsRemaining === 0 ? 429 : 400 }
      );
    }

    const user = await prisma.$transaction(async (tx) => {
      const currentPending = await tx.pendingSignup.findUnique({
        where: { id: pending.id },
      });

      if (
        !currentPending ||
        currentPending.expiresAt <= new Date() ||
        currentPending.otpExpiresAt <= new Date() ||
        currentPending.otpAttempts >= OTP_MAX_ATTEMPTS ||
        !signupOtpMatches(
          currentPending.id,
          code,
          currentPending.otpHash
        )
      ) {
        throw new VerificationStateChangedError();
      }

      const createdUser = await tx.user.create({
        data: {
          name: currentPending.name,
          username: currentPending.username,
          email: currentPending.email,
          passwordHash: currentPending.passwordHash,
          emailVerified: new Date(),
        },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          image: true,
          emailVerified: true,
          createdAt: true,
        },
      });

      await tx.pendingSignup.delete({
        where: { id: currentPending.id },
      });

      return createdUser;
    });

    return Response.json(
      {
        message: "Email verified and account created successfully.",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof VerificationStateChangedError) {
      return Response.json(
        {
          error:
            "The verification state changed. Please use the newest code or restart signup.",
        },
        { status: 409 }
      );
    }

    if (isPrismaUniqueConstraintError(error)) {
      return Response.json(
        {
          error:
            "That Gmail address or username became unavailable. Please start signup again.",
        },
        { status: 409 }
      );
    }

    console.error("Signup verification error:", error);

    return Response.json(
      {
        error: "Unable to verify your email right now.",
      },
      { status: 500 }
    );
  }
}
