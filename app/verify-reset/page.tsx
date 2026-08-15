import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AuthThemeToggle from "@/components/auth/AuthThemeToggle";
import PasswordResetVerificationForm from "@/components/auth/PasswordResetVerificationForm";
import { prisma } from "@/lib/prisma";
import { getPasswordResetDeliveryMode } from "@/lib/password-reset-email";
import {
  addResetSeconds,
  maskResetEmail,
  PASSWORD_RESET_RESEND_COOLDOWN_SECONDS,
  resetSecondsUntil,
} from "@/lib/password-reset-otp";

type VerifyResetPageProps = {
  searchParams: Promise<{ request?: string | string[] }>;
};

function getFirst(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function VerifyResetPage({ searchParams }: VerifyResetPageProps) {
  const session = await auth();
  if (session?.user) redirect("/");

  const params = await searchParams;
  const requestId = getFirst(params.request)?.trim();
  const pending = requestId
    ? await prisma.passwordResetRequest.findUnique({
        where: { id: requestId },
        select: {
          id: true,
          email: true,
          expiresAt: true,
          usedAt: true,
          lastOtpSentAt: true,
        },
      })
    : null;

  const isAvailable = Boolean(
    pending && !pending.usedAt && pending.expiresAt > new Date()
  );

  return (
    <main className="auth-page auth-signup-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <AuthThemeToggle />

      <section className="auth-signup-shell" aria-label="Verify your password reset code">
        <div className="auth-form-card auth-signup-card card">
          {isAvailable && pending ? (
            <PasswordResetVerificationForm
              requestId={pending.id}
              maskedEmail={maskResetEmail(pending.email)}
              initialCooldownSeconds={resetSecondsUntil(
                addResetSeconds(
                  pending.lastOtpSentAt,
                  PASSWORD_RESET_RESEND_COOLDOWN_SECONDS
                )
              )}
              deliveryMode={getPasswordResetDeliveryMode()}
            />
          ) : (
            <div className="auth-verification-unavailable">
              <div className="auth-form-heading auth-signup-heading">
                <h2>Reset verification unavailable</h2>
                <p>This password reset request is missing, expired, or already used.</p>
              </div>
              <Link className="auth-primary-btn auth-link-btn" href="/forgot-password">
                Start password recovery again
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
