"use client";

import Link from "next/link";
import Brand from "@/components/Brand";
import { FormEvent, useState } from "react";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [showEmail, setShowEmail] = useState(true);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);

    // Keep the current recovery UI flow without exposing account-existence feedback.
    await new Promise((resolve) => setTimeout(resolve, 700));

    setPending(false);
  };

  return (
    <>
      <div className="auth-form-heading auth-login-heading">
        <div className="auth-login-brand">
          <Brand href="/" />
        </div>
        <h2>Reset your password</h2>
        <p>Enter your email and we&apos;ll help you continue the recovery flow.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span>Email</span>
          <div className="auth-password-input">
            <input
              type={showEmail ? "email" : "password"}
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              inputMode="email"
              required
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowEmail((current) => !current)}
              aria-label={showEmail ? "Hide email" : "Show email"}
              aria-pressed={showEmail}
              title={showEmail ? "Hide email" : "Show email"}
            >
              {showEmail ? (
                <svg
                  className="auth-password-icon auth-password-icon-open"
                  viewBox="0 0 32 26"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2.8 15.3C6.7 10.5 11.1 8.2 16 8.2C20.9 8.2 25.3 10.5 29.2 15.3C25.3 20.1 20.9 22.4 16 22.4C11.1 22.4 6.7 20.1 2.8 15.3Z"
                    stroke="currentColor"
                    strokeWidth="2.35"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="16" cy="15.3" r="4.25" fill="currentColor" />
                  <path d="M6.2 7.8L4.1 5.6" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
                  <path d="M10.7 6.2L9.5 3.1" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
                  <path d="M16 5.6V2.3" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
                  <path d="M21.3 6.2L22.5 3.1" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
                  <path d="M25.8 7.8L27.9 5.6" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
                </svg>
              ) : (
                <svg
                  className="auth-password-icon auth-password-icon-closed"
                  viewBox="0 0 28 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 7.8C6.2 11.1 9.85 12.65 14 12.65C18.15 12.65 21.8 11.1 25 7.8"
                    stroke="currentColor"
                    strokeWidth="2.35"
                    strokeLinecap="round"
                  />
                  <path d="M6.2 11.1L4.6 14.1" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
                  <path d="M10 12.45L9.2 15.65" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
                  <path d="M14 12.75V16.1" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
                  <path d="M18 12.45L18.8 15.65" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
                  <path d="M21.8 11.1L23.4 14.1" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </label>

        <button className="auth-primary-btn" type="submit" disabled={pending}>
          {pending ? (
            <>
              <span className="auth-spinner" aria-hidden="true" />
              Preparing reset…
            </>
          ) : (
            <>
              Send reset link
              <span aria-hidden="true">→</span>
            </>
          )}
        </button>
      </form>

      <div className="auth-login-footer-links">
        <p className="auth-switch-copy">
          Remembered it? <Link href="/login">Back to sign in</Link>
        </p>
        <p className="auth-switch-copy auth-secondary-copy">
          Need a new profile? <Link href="/signup">Create an account</Link>
        </p>
      </div>
    </>
  );
}
