"use client";

import Brand from "@/components/Brand";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { validateResetPasswordValue } from "@/lib/password-reset-validation";

type ResetPasswordFormProps = {
  requestId: string;
};

type CompleteResponse = {
  message?: string;
  error?: string;
};

function WarningIcon() {
  return (
    <svg className="auth-validation-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10.3 3.45a2 2 0 0 1 3.4 0l8.02 13.1A2 2 0 0 1 20.02 19H3.98a2 2 0 0 1-1.7-2.45l8.02-13.1Z" fill="currentColor" />
      <path d="M12 8v5" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16.2" r="1.15" fill="white" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="auth-validation-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path d="m7.7 12.2 2.7 2.7 5.9-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PasswordEye({ open }: { open: boolean }) {
  return open ? (
    <svg className="auth-password-icon auth-password-icon-open" viewBox="0 0 32 26" fill="none" aria-hidden="true">
      <path d="M2.8 15.3C6.7 10.5 11.1 8.2 16 8.2C20.9 8.2 25.3 10.5 29.2 15.3C25.3 20.1 20.9 22.4 16 22.4C11.1 22.4 6.7 20.1 2.8 15.3Z" stroke="currentColor" strokeWidth="2.35" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="15.3" r="4.25" fill="currentColor" />
      <path d="M6.2 7.8L4.1 5.6" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
      <path d="M10.7 6.2L9.5 3.1" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
      <path d="M16 5.6V2.3" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
      <path d="M21.3 6.2L22.5 3.1" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
      <path d="M25.8 7.8L27.9 5.6" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
    </svg>
  ) : (
    <svg className="auth-password-icon auth-password-icon-closed" viewBox="0 0 28 20" fill="none" aria-hidden="true">
      <path d="M3 7.8C6.2 11.1 9.85 12.65 14 12.65C18.15 12.65 21.8 11.1 25 7.8" stroke="currentColor" strokeWidth="2.35" strokeLinecap="round" />
      <path d="M6.2 11.1L4.6 14.1" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M10 12.45L9.2 15.65" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M14 12.75V16.1" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M18 12.45L18.8 15.65" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M21.8 11.1L23.4 14.1" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}

export default function ResetPasswordForm({ requestId }: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const passwordState = useMemo(
    () => (password ? validateResetPasswordValue(password) : null),
    [password]
  );
  const passwordsMatch = Boolean(confirmPassword && password === confirmPassword);
  const confirmInvalid = Boolean(confirmPassword && password !== confirmPassword);
  const canSubmit = Boolean(passwordState?.valid && passwordsMatch && !pending);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setPending(true);
    setError("");

    try {
      const response = await fetch("/api/auth/password-reset/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, password, confirmPassword }),
      });
      const data = (await response.json()) as CompleteResponse;

      if (!response.ok) {
        setError(data.error || "Unable to update your password.");
        return;
      }

      router.replace("/login?reset=1");
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <div className="auth-form-heading auth-signup-heading">
        <div className="auth-signup-brand">
          <Brand href="/" />
        </div>
        <h2>Set a new password</h2>
        <p>Choose a strong password for your Gupto account.</p>
      </div>

      {error ? (
        <div className="auth-form-message error" role="alert" aria-live="polite">
          <WarningIcon />
          <span>{error}</span>
        </div>
      ) : null}

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field-grid">
          <label className="auth-field">
            <span>New password</span>
            <div className="auth-password-input">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                placeholder="Create a strong password"
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                required
              />
              <button type="button" className="auth-password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
                <PasswordEye open={showPassword} />
              </button>
            </div>
            {passwordState ? (
              <div className={`auth-validation-message ${passwordState.valid ? "success" : "error"}`} aria-live="polite">
                {passwordState.valid ? <CheckIcon /> : <WarningIcon />}
                <span>{passwordState.message}</span>
              </div>
            ) : null}
          </label>

          <label className="auth-field">
            <span>Confirm password</span>
            <div className="auth-password-input">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setError("");
                }}
                placeholder="Repeat password"
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                required
              />
              <button type="button" className="auth-password-toggle" onClick={() => setShowConfirmPassword((value) => !value)} aria-label={showConfirmPassword ? "Hide password" : "Show password"}>
                <PasswordEye open={showConfirmPassword} />
              </button>
            </div>
            {passwordsMatch ? (
              <div className="auth-validation-message success" aria-live="polite">
                <CheckIcon />
                <span>Passwords match.</span>
              </div>
            ) : confirmInvalid ? (
              <div className="auth-validation-message error" aria-live="polite">
                <WarningIcon />
                <span>Passwords do not match.</span>
              </div>
            ) : null}
          </label>
        </div>

        <button className="auth-primary-btn" type="submit" disabled={!canSubmit}>
          {pending ? (
            <>
              <span className="auth-spinner" aria-hidden="true" />
              Updating password…
            </>
          ) : (
            <>
              Set new password
              <span aria-hidden="true">→</span>
            </>
          )}
        </button>
      </form>
    </>
  );
}
