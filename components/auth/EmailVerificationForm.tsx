"use client";

import Brand from "@/components/Brand";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type VerifyResponse = {
  error?: string;
  attemptsExhausted?: boolean;
  codeExpired?: boolean;
  user?: {
    email?: string | null;
  };
};

type ResendResponse = {
  error?: string;
  message?: string;
  retryAfterSeconds?: number;
};

type EmailVerificationFormProps = {
  requestId: string;
  maskedEmail: string;
  initialCooldownSeconds: number;
  deliveryMode: "console" | "resend";
};

export default function EmailVerificationForm({
  requestId,
  maskedEmail,
  initialCooldownSeconds,
  deliveryMode,
}: EmailVerificationFormProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [resendPending, setResendPending] = useState(false);
  const [restartPending, setRestartPending] = useState(false);
  const [cooldown, setCooldown] = useState(initialCooldownSeconds);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

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
      const response = await fetch("/api/auth/signup/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, code }),
      });

      const data = (await response.json()) as VerifyResponse;

      if (!response.ok) {
        setError(data.error || "Unable to verify the code.");
        return;
      }

      const email = data.user?.email
        ? `&email=${encodeURIComponent(data.user.email)}`
        : "";

      router.replace(`/login?created=1${email}`);
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resendPending) {
      return;
    }

    setError("");
    setNotice("");
    setResendPending(true);

    try {
      const response = await fetch("/api/auth/signup/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });

      const data = (await response.json()) as ResendResponse;

      if (!response.ok) {
        if (data.retryAfterSeconds) {
          setCooldown(data.retryAfterSeconds);
        }

        setError(data.error || "Unable to resend the code.");
        return;
      }

      setCode("");
      setCooldown(data.retryAfterSeconds ?? 60);
      setNotice(data.message || "A new verification code was sent.");
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setResendPending(false);
    }
  };


  const handleStartAgain = async () => {
    if (restartPending) {
      return;
    }

    setError("");
    setNotice("");
    setRestartPending(true);

    try {
      const response = await fetch("/api/auth/signup/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setError(data.error || "Unable to restart signup.");
        return;
      }

      router.replace("/signup");
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setRestartPending(false);
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
              6-digit code for <strong>{maskedEmail}</strong>. The code expires
              in 10 minutes.
            </>
          ) : (
            <>
              We sent a 6-digit verification code to <strong>{maskedEmail}</strong>.
              The code expires in 10 minutes.
            </>
          )}
        </p>
      </div>

      {error && (
        <div className="auth-alert error" role="alert">
          <span aria-hidden="true">!</span>
          {error}
        </div>
      )}

      {notice && (
        <div className="auth-alert success" role="status">
          <span aria-hidden="true">✓</span>
          {notice}
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span>Verification code</span>
          <input
            className="auth-otp-input"
            type="text"
            name="code"
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="000000"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            autoFocus
            required
          />
        </label>

        <button className="auth-primary-btn" type="submit" disabled={pending}>
          {pending ? (
            <>
              <span className="auth-spinner" aria-hidden="true" />
              Verifying…
            </>
          ) : (
            <>
              Verify & create account
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
