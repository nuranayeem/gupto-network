"use server";

import { AuthError } from "next-auth";
import { compare } from "bcryptjs";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";

export type LoginActionState = {
  error?: string;
};

export type LoginCredentialCheckResult = {
  valid: boolean;
};

function safeRedirectPath(value: FormDataEntryValue | null) {
  const path = typeof value === "string" ? value : "/";
  return path.startsWith("/") && !path.startsWith("//") ? path : "/";
}

export async function checkLoginCredentials(
  identifierInput: string,
  password: string
): Promise<LoginCredentialCheckResult> {
  const identifier = identifierInput.trim().toLowerCase();

  if (!identifier || password.length < 8 || password.length > 72) {
    return { valid: false };
  }

  const user = identifier.includes("@")
    ? await prisma.user.findUnique({
        where: { email: identifier },
        select: { passwordHash: true },
      })
    : await prisma.user.findUnique({
        where: { username: identifier },
        select: { passwordHash: true },
      });

  if (!user?.passwordHash) {
    return { valid: false };
  }

  return {
    valid: await compare(password, user.passwordHash),
  };
}

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = safeRedirectPath(formData.get("redirectTo"));

  if (!identifier || !password) {
    return { error: "Enter your email or username and password." };
  }

  try {
    await signIn("credentials", {
      identifier,
      password,
      redirectTo,
    });

    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { error: "Email, username, or password is incorrect." };
      }

      return { error: "We couldn't sign you in. Please try again." };
    }

    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
