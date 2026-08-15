"use client";

import Link from "next/link";
import Brand from "@/components/Brand";
import { useRouter } from "next/navigation";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";

type SignupResponse = {
  error?: string;
  fields?: Record<string, string[] | undefined>;
  requestId?: string;
};

type AvailabilityResponse = {
  username?: { available: boolean };
  email?: { available: boolean };
};

type AvailabilityState = "idle" | "checking" | "available" | "unavailable" | "error";
type ValidationTone = "error" | "success";

type ValidationResult = {
  tone: ValidationTone;
  message: string;
} | null;

const englishNamePattern = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
const usernamePattern = /^[A-Za-z0-9_]+$/;
const gmailPattern = /^[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*@gmail\.com$/i;
const gmailLocalMinLength = 6;
const gmailLocalMaxLength = 30;
const printableAsciiPasswordPattern = /^[\x21-\x7E]+$/;

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

function ValidationMessage({ result }: { result: ValidationResult }) {
  if (!result) return null;

  return (
    <span
      className={`auth-validation-message ${result.tone}`}
      role={result.tone === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      {result.tone === "error" ? <WarningIcon /> : <CheckIcon />}
      <span>{result.message}</span>
    </span>
  );
}

function PasswordVisibilityIcon({ visible }: { visible: boolean }) {
  return visible ? (
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
  );
}

function getNameValidation(value: string): ValidationResult {
  if (!value) return null;

  if (value.length < 2 || value.length > 50 || !englishNamePattern.test(value)) {
    return {
      tone: "error",
      message: "Use English letters and single spaces only.",
    };
  }

  return { tone: "success", message: "Name looks good." };
}

function getUsernameSyntaxValidation(value: string): ValidationResult {
  if (!value) return null;

  if (value.length < 3) {
    return { tone: "error", message: "Username needs at least 3 characters." };
  }

  if (value.length > 30) {
    return { tone: "error", message: "Username can be up to 30 characters." };
  }

  if (!usernamePattern.test(value)) {
    return {
      tone: "error",
      message: "Use English letters, numbers, and underscores only.",
    };
  }

  if (!/[A-Za-z]/.test(value)) {
    return {
      tone: "error",
      message: "Username must contain at least one English letter.",
    };
  }

  return { tone: "success", message: "Username format is valid." };
}

function getEmailSyntaxValidation(value: string): ValidationResult {
  if (!value) return null;

  const normalized = value.trim().toLowerCase();
  const gmailLocalPart = normalized.endsWith("@gmail.com")
    ? normalized.slice(0, -"@gmail.com".length)
    : "";

  if (
    !gmailPattern.test(normalized) ||
    gmailLocalPart.length < gmailLocalMinLength ||
    gmailLocalPart.length > gmailLocalMaxLength
  ) {
    return {
      tone: "error",
      message: "Use a standard Gmail address with letters, numbers, or single periods only. No +aliases.",
    };
  }

  return { tone: "success", message: "Gmail format is valid." };
}

function getPasswordValidation(value: string): ValidationResult {
  if (!value) return null;

  if (value.length < 8) {
    return { tone: "error", message: "Password needs at least 8 characters." };
  }

  if (value.length > 72) {
    return { tone: "error", message: "Password can be up to 72 characters." };
  }

  if (!printableAsciiPasswordPattern.test(value)) {
    return {
      tone: "error",
      message: "Use standard English/ASCII characters only, without spaces.",
    };
  }

  if (!/[A-Z]/.test(value)) {
    return { tone: "error", message: "Add at least one capital letter (A-Z)." };
  }

  if (!/[a-z]/.test(value)) {
    return { tone: "error", message: "Add at least one small letter (a-z)." };
  }

  if (!/[0-9]/.test(value)) {
    return { tone: "error", message: "Add at least one number (0-9)." };
  }

  if (!/[^A-Za-z0-9]/.test(value)) {
    return { tone: "error", message: "Add at least one special character." };
  }

  return { tone: "success", message: "Password meets all requirements." };
}

function getConfirmPasswordValidation(password: string, confirmPassword: string): ValidationResult {
  if (!confirmPassword) return null;

  if (password !== confirmPassword) {
    return { tone: "error", message: "Passwords do not match." };
  }

  return { tone: "success", message: "Passwords match." };
}

function buildAvailabilityValidation(
  kind: "username" | "email",
  syntax: ValidationResult,
  availability: AvailabilityState,
  serverError: string
): ValidationResult {
  if (serverError) {
    return { tone: "error", message: serverError };
  }

  if (!syntax || syntax.tone === "error") return syntax;

  if (availability === "error") {
    return {
      tone: "error",
      message:
        kind === "username"
          ? "Could not check username availability. Edit the username to try again."
          : "Could not check Gmail availability. Edit the Gmail address to try again.",
    };
  }

  if (availability === "unavailable") {
    return {
      tone: "error",
      message:
        kind === "username"
          ? "That username is already taken or temporarily reserved."
          : "That Gmail address is already connected to an account or verification request.",
    };
  }

  if (availability === "available") {
    return {
      tone: "success",
      message: kind === "username" ? "Username is available." : "Gmail address is available.",
    };
  }

  if (availability === "checking") {
    return {
      tone: "success",
      message:
        kind === "username"
          ? "Username format is valid. Checking availability…"
          : "Gmail format is valid. Checking availability…",
    };
  }

  return syntax;
}

export default function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameUnlocked, setUsernameUnlocked] = useState(false);
  const [usernameCharacterError, setUsernameCharacterError] = useState("");
  const [usernameServerError, setUsernameServerError] = useState("");
  const [emailServerError, setEmailServerError] = useState("");
  const [usernameAvailability, setUsernameAvailability] = useState<AvailabilityState>("idle");
  const [emailAvailability, setEmailAvailability] = useState<AvailabilityState>("idle");
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  const trimmedName = name.trim();
  const normalizedUsername = username.trim().toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();

  const nameValidation = useMemo(() => getNameValidation(trimmedName), [trimmedName]);
  const usernameSyntaxValidation = useMemo(
    () => getUsernameSyntaxValidation(normalizedUsername),
    [normalizedUsername]
  );
  const emailSyntaxValidation = useMemo(
    () => getEmailSyntaxValidation(normalizedEmail),
    [normalizedEmail]
  );
  const passwordValidation = useMemo(() => getPasswordValidation(password), [password]);
  const confirmPasswordValidation = useMemo(
    () => getConfirmPasswordValidation(password, confirmPassword),
    [password, confirmPassword]
  );

  const usernameValidation = useMemo<ValidationResult>(() => {
    if (usernameCharacterError) {
      return { tone: "error", message: usernameCharacterError };
    }

    return buildAvailabilityValidation(
      "username",
      usernameSyntaxValidation,
      usernameAvailability,
      usernameServerError
    );
  }, [usernameAvailability, usernameCharacterError, usernameServerError, usernameSyntaxValidation]);

  const emailValidation = useMemo(
    () =>
      buildAvailabilityValidation(
        "email",
        emailSyntaxValidation,
        emailAvailability,
        emailServerError
      ),
    [emailAvailability, emailServerError, emailSyntaxValidation]
  );

  useEffect(() => {
    if (!usernameSyntaxValidation || usernameSyntaxValidation.tone === "error" || usernameCharacterError) {
      setUsernameAvailability("idle");
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setUsernameAvailability("checking");

      try {
        const response = await fetch(
          `/api/auth/signup/availability?username=${encodeURIComponent(normalizedUsername)}`,
          { signal: controller.signal, cache: "no-store" }
        );

        if (!response.ok) throw new Error("availability-check-failed");

        const data = (await response.json()) as AvailabilityResponse;
        setUsernameAvailability(data.username?.available ? "available" : "unavailable");
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Username availability check failed:", error);
        setUsernameAvailability("error");
      }
    }, 450);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [normalizedUsername, usernameCharacterError, usernameSyntaxValidation]);

  useEffect(() => {
    if (!emailSyntaxValidation || emailSyntaxValidation.tone === "error") {
      setEmailAvailability("idle");
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setEmailAvailability("checking");

      try {
        const response = await fetch(
          `/api/auth/signup/availability?email=${encodeURIComponent(normalizedEmail)}`,
          { signal: controller.signal, cache: "no-store" }
        );

        if (!response.ok) throw new Error("availability-check-failed");

        const data = (await response.json()) as AvailabilityResponse;
        setEmailAvailability(data.email?.available ? "available" : "unavailable");
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Gmail availability check failed:", error);
        setEmailAvailability("error");
      }
    }, 450);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [emailSyntaxValidation, normalizedEmail]);

  const canSubmit =
    nameValidation?.tone === "success" &&
    usernameValidation?.tone === "success" &&
    usernameAvailability === "available" &&
    emailValidation?.tone === "success" &&
    emailAvailability === "available" &&
    passwordValidation?.tone === "success" &&
    confirmPasswordValidation?.tone === "success";

  const handleUsernameChange = (nextValue: string) => {
    setFormError("");
    setUsernameServerError("");
    setUsernameAvailability("idle");

    if (!/^[A-Za-z0-9_]*$/.test(nextValue)) {
      setUsernameCharacterError("Only English letters, numbers, and underscores can be entered here.");
      return;
    }

    setUsernameCharacterError("");
    setUsername(nextValue);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (!canSubmit) return;

    const payload = {
      name: trimmedName,
      username: normalizedUsername,
      email: normalizedEmail,
      password,
    };

    setPending(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as SignupResponse;

      if (!response.ok) {
        const fieldMessage = data.fields
          ? Object.values(data.fields).flat().find(Boolean)
          : undefined;
        const message = fieldMessage || data.error || "Unable to start verification.";
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes("username")) {
          setUsernameServerError(message);
          setUsernameAvailability("unavailable");
        } else if (lowerMessage.includes("gmail") || lowerMessage.includes("email")) {
          setEmailServerError(message);
          setEmailAvailability("unavailable");
        } else {
          setFormError(message);
        }
        return;
      }

      if (!data.requestId) {
        setFormError("Verification could not be started. Please try again.");
        return;
      }

      router.push(`/verify-email?request=${encodeURIComponent(data.requestId)}`);
    } catch {
      setFormError("Unable to reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  };

  const passwordToggle = (
    visible: boolean,
    toggle: () => void,
    label: string
  ): ReactNode => (
    <button
      type="button"
      className="auth-password-toggle"
      onClick={toggle}
      aria-label={`${visible ? "Hide" : "Show"} ${label}`}
      aria-pressed={visible}
      title={`${visible ? "Hide" : "Show"} ${label}`}
    >
      <PasswordVisibilityIcon visible={visible} />
    </button>
  );

  return (
    <>
      <div className="auth-form-heading auth-signup-heading">
        <div className="auth-signup-brand">
          <Brand href="/" />
        </div>
        <h2>Create your account</h2>
        <p>Your space starts with a few simple details.</p>
      </div>

      {formError && (
        <div className="auth-form-message error" role="alert">
          <WarningIcon />
          <span>{formError}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate autoComplete="off">
        <div className="auth-field-grid">
          <label className="auth-field">
            <span>Name</span>
            <input
              type="text"
              name="name"
              placeholder="Your name"
              autoComplete="name"
              value={name}
              onChange={(event) => {
                setFormError("");
                setName(event.target.value);
              }}
              minLength={2}
              maxLength={50}
              required
            />
            <ValidationMessage result={nameValidation} />
          </label>

          <label className="auth-field">
            <span>Username</span>
            <div className="auth-prefix-input">
              <span>@</span>
              <input
                type="text"
                name="username"
                placeholder="username"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                data-form-type="other"
                readOnly={!usernameUnlocked}
                onFocus={() => setUsernameUnlocked(true)}
                value={username}
                onChange={(event) => handleUsernameChange(event.target.value)}
                minLength={3}
                maxLength={30}
                inputMode="text"
                required
              />
            </div>
            <ValidationMessage result={usernameValidation} />
          </label>
        </div>

        <label className="auth-field">
          <span>Gmail</span>
          <input
            type="email"
            name="email"
            placeholder="you@gmail.com"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            inputMode="email"
            value={email}
            onChange={(event) => {
              setFormError("");
              setEmailServerError("");
              setEmailAvailability("idle");
              setEmail(event.target.value);
            }}
            required
          />
          <ValidationMessage result={emailValidation} />
        </label>

        <div className="auth-field-grid">
          <label className="auth-field">
            <span>Password</span>
            <div className="auth-password-input">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Create a strong password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => {
                  setFormError("");
                  setPassword(event.target.value);
                }}
                minLength={8}
                maxLength={72}
                required
              />
              {passwordToggle(showPassword, () => setShowPassword((current) => !current), "password")}
            </div>
            <ValidationMessage result={passwordValidation} />
          </label>

          <label className="auth-field">
            <span>Confirm password</span>
            <div className="auth-password-input">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Repeat password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => {
                  setFormError("");
                  setConfirmPassword(event.target.value);
                }}
                minLength={8}
                maxLength={72}
                required
              />
              {passwordToggle(
                showConfirmPassword,
                () => setShowConfirmPassword((current) => !current),
                "confirmation password"
              )}
            </div>
            <ValidationMessage result={confirmPasswordValidation} />
          </label>
        </div>

        <p className="auth-helper-copy">
          Verification is required before the account is created. Local development shows the verification code only in the Next.js server terminal.
        </p>

        <button className="auth-primary-btn" type="submit" disabled={pending || !canSubmit}>
          {pending ? (
            <>
              <span className="auth-spinner" aria-hidden="true" />
              Preparing verification code…
            </>
          ) : (
            <>
              Continue
              <span aria-hidden="true">→</span>
            </>
          )}
        </button>
      </form>

      <p className="auth-switch-copy">
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </>
  );
}
