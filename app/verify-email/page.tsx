import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AuthThemeToggle from "@/components/auth/AuthThemeToggle";
import EmailVerificationForm from "@/components/auth/EmailVerificationForm";
import { prisma } from "@/lib/prisma";
import { getSignupOtpDeliveryMode } from "@/lib/signup-email";
import {
  addSeconds,
  maskEmail,
  OTP_RESEND_COOLDOWN_SECONDS,
  secondsUntil,
} from "@/lib/signup-otp";

type VerifyEmailPageProps = {
  searchParams: Promise<{
    request?: string | string[];
  }>;
};

function getFirst(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  const params = await searchParams;
  const requestId = getFirst(params.request)?.trim();

  const pending = requestId
    ? await prisma.pendingSignup.findUnique({
        where: { id: requestId },
        select: {
          id: true,
          email: true,
          expiresAt: true,
          lastOtpSentAt: true,
        },
      })
    : null;

  const isAvailable = Boolean(pending && pending.expiresAt > new Date());
  const deliveryMode = getSignupOtpDeliveryMode();

  return (
    <main className="auth-page auth-signup-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <AuthThemeToggle />

      <section
        className="auth-signup-shell"
        aria-label="Verify your Gupto Network email"
      >
        <div className="auth-form-card auth-signup-card card">
          {isAvailable && pending ? (
            <EmailVerificationForm
              requestId={pending.id}
              maskedEmail={maskEmail(pending.email)}
              initialCooldownSeconds={secondsUntil(
                addSeconds(
                  pending.lastOtpSentAt,
                  OTP_RESEND_COOLDOWN_SECONDS
                )
              )}
              deliveryMode={deliveryMode}
            />
          ) : (
            <div className="auth-verification-unavailable">
              <div className="auth-form-heading auth-signup-heading">
                <h2>Verification unavailable</h2>
                <p>
                  This signup verification request is missing or has expired.
                </p>
              </div>
              <Link className="auth-primary-btn auth-link-btn" href="/signup">
                Start signup again
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
