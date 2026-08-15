"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type LoginActionState } from "@/app/auth-actions";
import AnimatedGuptoMascot from "@/components/auth/AnimatedGuptoMascot";

type LoginFormProps = {
  redirectTo: string;
  created?: boolean;
  defaultEmail?: string;
};

const initialState: LoginActionState = {};

function LoginButton() {
  const { pending } = useFormStatus();

  return (
    <button className="auth-primary-btn" type="submit" disabled={pending}>
      {pending ? (
        <>
          <span className="auth-spinner" aria-hidden="true" />
          Signing in…
        </>
      ) : (
        <>
          Sign in
          <span aria-hidden="true">→</span>
        </>
      )}
    </button>
  );
}

export default function LoginForm({
  redirectTo,
  created = false,
  defaultEmail = "",
}: LoginFormProps) {
  const [state, formAction] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      <div className="auth-form-heading auth-login-heading">
        <div className="auth-login-brand auth-login-brand-animated">
          <AnimatedGuptoMascot coveringEyes={showPassword} />
        </div>
        <h2>Sign in to Gupto</h2>
        <p>Pick up where you left off.</p>
      </div>

      {created && (
        <div className="auth-alert success" role="status">
          <span aria-hidden="true">✓</span>
          Account created. Sign in to continue.
        </div>
      )}

      {state.error && (
        <div className="auth-alert error" role="alert">
          <span aria-hidden="true">!</span>
          {state.error}
        </div>
      )}

      <form action={formAction} className="auth-form">
        <input type="hidden" name="redirectTo" value={redirectTo} />

        <label className="auth-field">
          <span>Email</span>
          <input
            type="email"
            name="email"
            defaultValue={defaultEmail}
            placeholder="you@example.com"
            autoComplete="email"
            inputMode="email"
            required
          />
        </label>

        <label className="auth-field">
          <span>Password</span>
          <div className="auth-password-input">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              minLength={8}
              maxLength={72}
              required
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
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

        <LoginButton />
      </form>

      <div className="auth-login-footer-links">
        <p className="auth-switch-copy">
          New to Gupto? <Link href="/signup">Create an account</Link>
        </p>
        <p className="auth-switch-copy auth-secondary-copy">
          Can&apos;t access your password?{" "}
          <Link href="/forgot-password">Reset it here</Link>
        </p>
      </div>
    </>
  );
}
