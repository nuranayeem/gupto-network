import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AuthThemeToggle from "@/components/auth/AuthThemeToggle";
import SignupForm from "@/components/auth/SignupForm";

export default async function SignupPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <main className="auth-page auth-signup-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <AuthThemeToggle />

      <section
        className="auth-signup-shell"
        aria-label="Create a Gupto Network account"
      >
        <div className="auth-form-card auth-signup-card card">
          <SignupForm />
        </div>
      </section>
    </main>
  );
}
