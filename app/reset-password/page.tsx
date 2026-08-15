import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AuthThemeToggle from "@/components/auth/AuthThemeToggle";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { prisma } from "@/lib/prisma";
import { hashPasswordResetToken } from "@/lib/password-reset-otp";

type ResetPasswordPageProps = {
  searchParams: Promise<{ request?: string | string[] }>;
};

function getFirst(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const session = await auth();
  if (session?.user) redirect("/");

  const params = await searchParams;
  const requestId = getFirst(params.request)?.trim();
  const cookieStore = await cookies();
  const resetToken = cookieStore.get("gupto_password_reset")?.value;
  const resetTokenHash = resetToken ? hashPasswordResetToken(resetToken) : null;

  const pending = requestId
    ? await prisma.passwordResetRequest.findUnique({ where: { id: requestId } })
    : null;

  const now = new Date();
  const isAvailable = Boolean(
    pending &&
      !pending.usedAt &&
      pending.verifiedAt &&
      resetTokenHash &&
      pending.resetTokenHash === resetTokenHash &&
      pending.resetTokenExpiresAt &&
      pending.resetTokenExpiresAt > now &&
      pending.expiresAt > now
  );

  return (
    <main className="auth-page auth-signup-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <AuthThemeToggle />

      <section className="auth-signup-shell" aria-label="Set a new Gupto password">
        <div className="auth-form-card auth-signup-card card">
          {isAvailable && pending ? (
            <ResetPasswordForm requestId={pending.id} />
          ) : (
            <div className="auth-verification-unavailable">
              <div className="auth-form-heading auth-signup-heading">
                <h2>Reset session unavailable</h2>
                <p>This verified password reset session is missing or has expired.</p>
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
