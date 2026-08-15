import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AuthThemeToggle from "@/components/auth/AuthThemeToggle";
import LoginForm from "@/components/auth/LoginForm";

type LoginPageProps = {
  searchParams: Promise<{
    callbackUrl?: string | string[];
    created?: string | string[];
    email?: string | string[];
    reset?: string | string[];
  }>;
};

function getFirst(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function safeRedirectPath(value: string | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  const params = await searchParams;
  const redirectTo = safeRedirectPath(getFirst(params.callbackUrl));
  const created = getFirst(params.created) === "1";
  const defaultEmail = getFirst(params.email) ?? "";
  const reset = getFirst(params.reset) === "1";

  return (
    <main className="auth-page auth-login-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <AuthThemeToggle />

      <section
        className="auth-login-shell"
        aria-label="Sign in to Gupto Network"
      >
        <div className="auth-form-card auth-login-card card">
          <LoginForm
            redirectTo={redirectTo}
            created={created}
            defaultEmail={defaultEmail}
            reset={reset}
          />
        </div>
      </section>
    </main>
  );
}
