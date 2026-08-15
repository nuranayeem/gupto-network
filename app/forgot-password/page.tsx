import AuthThemeToggle from "@/components/auth/AuthThemeToggle";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <main className="auth-page auth-forgot-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <AuthThemeToggle />

      <section
        className="auth-forgot-shell"
        aria-label="Reset your Gupto password"
      >
        <div className="auth-form-card auth-forgot-card card">
          <ForgotPasswordForm />
        </div>
      </section>
    </main>
  );
}
