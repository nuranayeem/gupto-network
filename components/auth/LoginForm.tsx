"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  checkLoginCredentials,
  loginAction,
  type LoginActionState,
} from "@/app/auth-actions";
import AnimatedGuptoMascot from "@/components/auth/AnimatedGuptoMascot";

type LoginFormProps = {
  redirectTo: string;
  created?: boolean;
  defaultEmail?: string;
  reset?: boolean;
};

const initialState: LoginActionState = {};

function WarningIcon() {
  return (
    <svg className="auth-validation-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10.3 3.45a2 2 0 0 1 3.4 0l8.02 13.1A2 2 0 0 1 20.02 19H3.98a2 2 0 0 1-1.7-2.45l8.02-13.1Z"
        fill="currentColor"
      />
      <path d="M12 8v5" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16.2" r="1.15" fill="white" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="auth-validation-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path
        d="m7.7 12.2 2.7 2.7 5.9-6"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
  reset = false,
}: LoginFormProps) {
  const [state, formAction] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [liveCredentialState, setLiveCredentialState] = useState<
    "idle" | "valid" | "invalid"
  >("idle");
  const [editedSinceSubmit, setEditedSinceSubmit] = useState(false);

  useEffect(() => {
    const cleanIdentifier = identifier.trim();

    if (!cleanIdentifier || password.length < 8) {
      setLiveCredentialState("idle");
      return;
    }

    let cancelled = false;
    setLiveCredentialState("idle");

    const timer = window.setTimeout(async () => {
      try {
        const result = await checkLoginCredentials(cleanIdentifier, password);
        if (!cancelled) {
          setLiveCredentialState(result.valid ? "valid" : "invalid");
        }
      } catch {
        if (!cancelled) {
          setLiveCredentialState("idle");
        }
      }
    }, 700);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [identifier, password]);

  return (
    <>
      <div className="auth-form-heading auth-login-heading">
        <div className="auth-login-brand auth-login-brand-animated">
          <AnimatedGuptoMascot coveringEyes={showPassword} />
        </div>
        <h2>Sign in to Gupto</h2>
        <p>Pick up where you left off.</p>
      </div>

      {liveCredentialState === "valid" ? (
        <div className="auth-form-message success" role="status" aria-live="polite">
          <CheckIcon />
          <span>Sign-in details are correct.</span>
        </div>
      ) : liveCredentialState === "invalid" ? (
        <div className="auth-form-message error" role="alert" aria-live="polite">
          <WarningIcon />
          <span>Email, username, or password is incorrect.</span>
        </div>
      ) : !editedSinceSubmit && state.error ? (
        <div className="auth-form-message error" role="alert" aria-live="polite">
          <WarningIcon />
          <span>{state.error}</span>
        </div>
      ) : !editedSinceSubmit && created ? (
        <div className="auth-form-message success" role="status" aria-live="polite">
          <CheckIcon />
          <span>Account created. Sign in to continue.</span>
        </div>
      ) : !editedSinceSubmit && reset ? (
        <div className="auth-form-message success" role="status" aria-live="polite">
          <CheckIcon />
          <span>Password updated. Sign in with your new password.</span>
        </div>
      ) : null}

      <form
        action={formAction}
        className="auth-form"
        autoComplete="off"
        onSubmit={() => setEditedSinceSubmit(false)}
      >
        <input type="hidden" name="redirectTo" value={redirectTo} />

        <label className="auth-field">
          <span>Email or username</span>
          <input
            type="text"
            name="identifier"
            value={identifier}
            onChange={(event) => {
              setIdentifier(event.target.value);
              setEditedSinceSubmit(true);
            }}
            placeholder="Email or username"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            required
          />
        </label>

        <label className="auth-field">
          <span>Password</span>
          <div className="auth-password-input">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setEditedSinceSubmit(true);
              }}
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
