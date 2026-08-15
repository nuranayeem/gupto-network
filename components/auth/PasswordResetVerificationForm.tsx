"use client";

import Brand from "@/components/Brand";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

type PasswordResetVerificationFormProps = {
  requestId: string;
  maskedEmail: string;
  initialCooldownSeconds: number;
  deliveryMode: "console" | "resend";
};

type VerifyResponse = {
  message?: string;
  requestId?: string;
  error?: string;
  attemptsRemaining?: number;
};

type ResendResponse = {
  message?: string;
  error?: string;
  retryAfterSeconds?: number;
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

export default function PasswordResetVerificationForm({
  requestId,
  maskedEmail,
  initialCooldownSeconds,
  deliveryMode,
}: PasswordResetVerificationFormProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [resendPending, setResendPending] = useState(false);
  const [restartPending, setRestartPending] = useState(false);
  const [cooldown, setCooldown] = useState(initialCooldownSeconds);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = window.setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit verification code.");
      return;
    }

    setPending(true);

    try {
      const response = await fetch("/api/auth/password-reset/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, code }),
      });
      const data = (await response.json()) as VerifyResponse;

      if (!response.ok) {
        setError(data.error || "Unable to verify the code.");
        return;
      }

      router.replace(`/reset-password?request=${encodeURIComponent(requestId)}`);
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resendPending) return;

    setError("");
    setNotice("");
    setResendPending(true);

    try {
      const response = await fetch("/api/auth/password-reset/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      const data = (await response.json()) as ResendResponse;

      if (!response.ok) {
        if (data.retryAfterSeconds) setCooldown(data.retryAfterSeconds);
        setError(data.error || "Unable to resend the code.");
        return;
      }

      setCode("");
      setCooldown(data.retryAfterSeconds ?? 60);
      setNotice(data.message || "A new reset code was generated.");
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setResendPending(false);
    }
  };

  const handleStartAgain = async () => {
    if (restartPending) return;

    setError("");
    setNotice("");
    setRestartPending(true);

    try {
      await fetch("/api/auth/password-reset/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
    } finally {
      router.replace("/forgot-password");
    }
  };

  return (
    <>
      <div className="auth-form-heading auth-signup-heading">
        <div className="auth-signup-brand">
          <Brand href="/" />
        </div>
        <h2>Verify your email</h2>
        <p>
          {deliveryMode === "console" ? (
            <>
              Local mode is active. Check the Next.js server terminal for the
              6-digit reset code for <strong>{maskedEmail}</strong>. The code
              expires in 10 minutes.
            </>
          ) : (
            <>
              We sent a 6-digit password reset code to <strong>{maskedEmail}</strong>.
              The code expires in 10 minutes.
            </>
          )}
        </p>
      </div>

      {error ? (
        <div className="auth-form-message error" role="alert" aria-live="polite">
          <WarningIcon />
          <span>{error}</span>
        </div>
      ) : notice ? (
        <div className="auth-form-message success" role="status" aria-live="polite">
          <CheckIcon />
          <span>{notice}</span>
        </div>
      ) : null}

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span>Verification code</span>
          <input
            className="auth-otp-input"
            type="text"
            name="code"
            value={code}
            onChange={(event) => {
              setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
              setError("");
              setNotice("");
            }}
            placeholder="000000"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            autoFocus
            required
          />
        </label>

        <button className="auth-primary-btn" type="submit" disabled={pending || code.length !== 6}>
          {pending ? (
            <>
              <span className="auth-spinner" aria-hidden="true" />
              Verifying…
            </>
          ) : (
            <>
              Verify code
              <span aria-hidden="true">→</span>
            </>
          )}
        </button>
      </form>

      <div className="auth-verification-actions">
        <button
          type="button"
          className="auth-text-btn"
          onClick={handleResend}
          disabled={cooldown > 0 || resendPending}
        >
          {resendPending
            ? deliveryMode === "console"
              ? "Generating…"
              : "Sending…"
            : cooldown > 0
              ? `Resend code in ${cooldown}s`
              : "Resend code"}
        </button>

        <p className="auth-switch-copy">
          Wrong Gmail address?{" "}
          <button
            type="button"
            className="auth-inline-link-btn"
            onClick={handleStartAgain}
            disabled={restartPending}
          >
            {restartPending ? "Restarting…" : "Start again"}
          </button>
        </p>
      </div>
    </>
  );
}
