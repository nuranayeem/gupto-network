"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Brand from "@/components/Brand";
import { FormEvent, useEffect, useState } from "react";
import { isStrictGmailAddress } from "@/lib/signup-validation";

type EmailStatus = "idle" | "checking" | "valid" | "invalid" | "missing";

type AvailabilityResponse = {
  valid?: boolean;
  exists?: boolean;
  message?: string;
  error?: string;
};

type StartResetResponse = {
  requestId?: string;
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

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [showEmail, setShowEmail] = useState(true);
  const [pending, setPending] = useState(false);
  const [emailStatus, setEmailStatus] = useState<EmailStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const normalized = email.trim().toLowerCase();
    setSubmitError("");

    if (!normalized) {
      setEmailStatus("idle");
      setStatusMessage("");
      return;
    }

    if (!isStrictGmailAddress(normalized)) {
      setEmailStatus("invalid");
      setStatusMessage(
        "Enter a valid Gmail address using letters, numbers, or single periods only."
      );
      return;
    }

    let cancelled = false;
    setEmailStatus("checking");
    setStatusMessage("");

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/auth/password-reset/availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: normalized }),
        });
        const data = (await response.json()) as AvailabilityResponse;

        if (cancelled) return;

        if (!response.ok || !data.valid) {
          setEmailStatus("invalid");
          setStatusMessage(data.error || "Unable to check that Gmail right now.");
          return;
        }

        if (data.exists) {
          setEmailStatus("valid");
          setStatusMessage(data.message || "Gupto account found.");
        } else {
          setEmailStatus("missing");
          setStatusMessage(
            data.message || "No Gupto account was found with that Gmail address."
          );
        }
      } catch {
        if (!cancelled) {
          setEmailStatus("invalid");
          setStatusMessage("Unable to check that Gmail right now.");
        }
      }
    }, 550);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [email]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (emailStatus !== "valid" || pending) return;

    setPending(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = (await response.json()) as StartResetResponse;

      if (!response.ok || !data.requestId) {
        setSubmitError(data.error || "Unable to start password recovery.");
        return;
      }

      router.push(`/verify-reset?request=${encodeURIComponent(data.requestId)}`);
    } catch {
      setSubmitError("Unable to reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  };

  const visibleError = submitError ||
    (emailStatus === "invalid" || emailStatus === "missing" ? statusMessage : "");
  const visibleSuccess = !submitError && emailStatus === "valid" ? statusMessage : "";

  return (
    <>
      <div className="auth-form-heading auth-login-heading">
        <div className="auth-login-brand">
          <Brand href="/" />
        </div>
        <h2>Reset your password</h2>
        <p>Enter your email and we&apos;ll help you continue the recovery flow.</p>
      </div>

      {visibleError ? (
        <div className="auth-form-message error" role="alert" aria-live="polite">
          <WarningIcon />
          <span>{visibleError}</span>
        </div>
      ) : visibleSuccess ? (
        <div className="auth-form-message success" role="status" aria-live="polite">
          <CheckIcon />
          <span>{visibleSuccess}</span>
        </div>
      ) : null}

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
              autoCapitalize="none"
              spellCheck={false}
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
              )}
            </button>
          </div>
        </label>

        <button
          className="auth-primary-btn"
          type="submit"
          disabled={pending || emailStatus !== "valid"}
        >
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
