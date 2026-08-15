import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  sendSignupOtpEmail,
  SignupEmailConfigurationError,
} from "@/lib/signup-email";
import {
  addMinutes,
  addSeconds,
  generateSignupOtp,
  hashSignupOtp,
  OTP_MAX_RESENDS,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_TTL_MINUTES,
  secondsUntil,
  SIGNUP_SESSION_TTL_MINUTES,
} from "@/lib/signup-otp";
import { signupSchema } from "@/lib/signup-validation";

function isPrismaUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

function signupEmailFailureResponse(error: unknown) {
  if (error instanceof SignupEmailConfigurationError) {
    console.error("Signup email configuration error:", error.message);
  } else {
    console.error("Signup OTP delivery error:", error);
  }

  return Response.json(
    {
      error: "We could not send the verification code. Please try again shortly.",
    },
    { status: 503 }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          error: "Please correct the signup information.",
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, username, email, password } = parsed.data;
    const now = new Date();

    // Expired verification sessions must not reserve usernames or emails.
    await prisma.pendingSignup.deleteMany({
      where: {
        expiresAt: {
          lte: now,
        },
      },
    });

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
      select: {
        email: true,
        username: true,
      },
    });

    if (existingUser?.username === username) {
      return Response.json(
        { error: "That username is already taken." },
        { status: 409 }
      );
    }

    if (existingUser?.email === email) {
      return Response.json(
        { error: "An account already exists with that Gmail address." },
        { status: 409 }
      );
    }

    const existingPending = await prisma.pendingSignup.findUnique({
      where: { email },
    });

    const pendingWithUsername = await prisma.pendingSignup.findUnique({
      where: { username },
      select: {
        id: true,
        email: true,
      },
    });

    if (
      pendingWithUsername &&
      pendingWithUsername.id !== existingPending?.id &&
      pendingWithUsername.email !== email
    ) {
      return Response.json(
        {
          error:
            "That username is currently reserved by another verification request. Try another username or try again later.",
        },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 12);

    // Re-submitting the same Gmail during an active signup updates the pending
    // details without allowing the initial endpoint to become an OTP spam path.
    if (existingPending) {
      const resendAvailableAt = addSeconds(
        existingPending.lastOtpSentAt,
        OTP_RESEND_COOLDOWN_SECONDS
      );

      if (resendAvailableAt > now) {
        await prisma.pendingSignup.update({
          where: { id: existingPending.id },
          data: {
            name,
            username,
            passwordHash,
          },
        });

        return Response.json(
          {
            message: "A verification code was already sent. Use the newest code.",
            requestId: existingPending.id,
            retryAfterSeconds: secondsUntil(resendAvailableAt),
          },
          { status: 202 }
        );
      }

      if (existingPending.otpResendCount >= OTP_MAX_RESENDS) {
        return Response.json(
          {
            error:
              "Verification resend limit reached. Start signup again after this session expires.",
          },
          { status: 429 }
        );
      }

      const code = generateSignupOtp();
      const otpHash = hashSignupOtp(existingPending.id, code);
      const otpExpiresAt = addMinutes(now, OTP_TTL_MINUTES);

      await prisma.pendingSignup.update({
        where: { id: existingPending.id },
        data: {
          name,
          username,
          passwordHash,
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
          to: email,
          code,
        });
        deliveryMode = delivery.deliveryMode;
      } catch (error) {
        // Restore the previous usable verification request if replacement
        // delivery fails.
        await prisma.pendingSignup.updateMany({
          where: {
            id: existingPending.id,
            otpHash,
          },
          data: {
            name: existingPending.name,
            username: existingPending.username,
            passwordHash: existingPending.passwordHash,
            otpHash: existingPending.otpHash,
            otpExpiresAt: existingPending.otpExpiresAt,
            otpAttempts: existingPending.otpAttempts,
            otpResendCount: existingPending.otpResendCount,
            lastOtpSentAt: existingPending.lastOtpSentAt,
          },
        });

        return signupEmailFailureResponse(error);
      }

      return Response.json(
        {
          message:
            deliveryMode === "console"
              ? "A new local verification code was generated. Check the Next.js server terminal."
              : "A new verification code was sent.",
          requestId: existingPending.id,
          retryAfterSeconds: OTP_RESEND_COOLDOWN_SECONDS,
        },
        { status: 202 }
      );
    }

    const requestId = crypto.randomUUID();
    const code = generateSignupOtp();
    const otpHash = hashSignupOtp(requestId, code);
    const otpExpiresAt = addMinutes(now, OTP_TTL_MINUTES);
    const expiresAt = addMinutes(now, SIGNUP_SESSION_TTL_MINUTES);

    const pendingSignup = await prisma.pendingSignup.create({
      data: {
        id: requestId,
        name,
        username,
        email,
        passwordHash,
        otpHash,
        otpExpiresAt,
        expiresAt,
        otpAttempts: 0,
        otpResendCount: 0,
        lastOtpSentAt: now,
      },
      select: {
        id: true,
      },
    });

    let deliveryMode: "console" | "resend";

    try {
      const delivery = await sendSignupOtpEmail({
        to: email,
        code,
      });
      deliveryMode = delivery.deliveryMode;
    } catch (error) {
      // Do not leave an unsent verification request reserving credentials.
      await prisma.pendingSignup.deleteMany({
        where: {
          id: pendingSignup.id,
          otpHash,
        },
      });

      return signupEmailFailureResponse(error);
    }

    return Response.json(
      {
        message:
          deliveryMode === "console"
            ? "Local verification code generated. Check the Next.js server terminal."
            : "Verification code sent.",
        requestId: pendingSignup.id,
        retryAfterSeconds: OTP_RESEND_COOLDOWN_SECONDS,
      },
      { status: 202 }
    );
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) {
      return Response.json(
        {
          error: "That Gmail address or username is already in use.",
        },
        { status: 409 }
      );
    }

    console.error("Signup start error:", error);

    return Response.json(
      {
        error: "Unable to start account verification.",
      },
      { status: 500 }
    );
  }
}
