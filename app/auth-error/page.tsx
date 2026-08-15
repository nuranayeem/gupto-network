import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";

type AuthErrorPageProps = {
  searchParams: Promise<{ error?: string | string[] }>;
};

const errorMessages: Record<string, string> = {
  Configuration: "Authentication is temporarily unavailable because of a server configuration issue.",
  AccessDenied: "You do not have permission to sign in with this account.",
  Verification: "This verification link is no longer valid. Please request a new one.",
};

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const params = await searchParams;
  const rawError = Array.isArray(params.error) ? params.error[0] : params.error;
  const message =
    (rawError && errorMessages[rawError]) ||
    "Something interrupted the sign-in process. Please try again.";

  return (
    <AuthShell
      eyebrow="AUTHENTICATION"
      title="We couldn't complete that."
      description="Your Gupto space is still here. Return to sign in and try once more."
    >
      <div className="auth-form-heading">
        <span className="eyebrow">TRY AGAIN</span>
        <h2>Sign-in issue</h2>
        <p>{message}</p>
      </div>

      <Link className="auth-primary-btn auth-link-btn" href="/login">
        Back to sign in
        <span aria-hidden="true">→</span>
      </Link>
    </AuthShell>
  );
}
