import type { ReactNode } from "react";
import Brand from "@/components/Brand";
import AuthThemeToggle from "./AuthThemeToggle";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export default function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: AuthShellProps) {
  return (
    <main className="auth-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <AuthThemeToggle />

      <section className="auth-shell" aria-label="Gupto Network authentication">
        <aside className="auth-intro glass">
          <Brand href="/" />

          <div className="auth-intro-copy">
            <span className="eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>

          <div className="auth-promise-list" aria-hidden="true">
            <div className="auth-promise-item">
              <span className="auth-promise-icon">01</span>
              <div>
                <strong>Meaningful connection</strong>
                <small>A focused space for the people and ideas that matter.</small>
              </div>
            </div>
            <div className="auth-promise-item">
              <span className="auth-promise-icon">02</span>
              <div>
                <strong>Simple by design</strong>
                <small>Clean conversations without unnecessary noise.</small>
              </div>
            </div>
          </div>

          <p className="auth-intro-footer">© 2026 Gupto Network</p>
        </aside>

        <div className="auth-form-wrap">
          <div className="auth-form-card card">{children}</div>
        </div>
      </section>
    </main>
  );
}
