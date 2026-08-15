import { prisma } from "@/lib/prisma";
import {
  GMAIL_LOCAL_MAX_LENGTH,
  GMAIL_LOCAL_MIN_LENGTH,
  isStrictGmailAddress,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from "@/lib/signup-validation";

const usernamePattern = /^[A-Za-z0-9_]+$/;

function isValidUsername(value: string) {
  return (
    value.length >= USERNAME_MIN_LENGTH &&
    value.length <= USERNAME_MAX_LENGTH &&
    usernamePattern.test(value) &&
    /[A-Za-z]/.test(value)
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const username = (url.searchParams.get("username") ?? "").trim().toLowerCase();
  const email = (url.searchParams.get("email") ?? "").trim().toLowerCase();
  const now = new Date();

  const result: {
    username?: { available: boolean };
    email?: { available: boolean };
  } = {};

  if (username && isValidUsername(username)) {
    const [existingUser, activePending] = await Promise.all([
      prisma.user.findUnique({
        where: { username },
        select: { id: true },
      }),
      prisma.pendingSignup.findFirst({
        where: {
          username,
          expiresAt: { gt: now },
        },
        select: { id: true },
      }),
    ]);

    result.username = {
      available: !existingUser && !activePending,
    };
  }

  if (email && isStrictGmailAddress(email)) {
    const localPart = email.slice(0, -"@gmail.com".length);

    if (
      localPart.length >= GMAIL_LOCAL_MIN_LENGTH &&
      localPart.length <= GMAIL_LOCAL_MAX_LENGTH
    ) {
      const [existingUser, activePending] = await Promise.all([
        prisma.user.findUnique({
          where: { email },
          select: { id: true },
        }),
        prisma.pendingSignup.findFirst({
          where: {
            email,
            expiresAt: { gt: now },
          },
          select: { id: true },
        }),
      ]);

      result.email = {
        available: !existingUser && !activePending,
      };
    }
  }

  return Response.json(result, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
