"use client";

import Link from "next/link";
import Brand from "@/components/Brand";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type SignupResponse = {
  error?: string;
  fields?: Record<string, string[] | undefined>;
};

export default function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const payload = {
      name: String(formData.get("name") ?? "").trim(),
      username: String(formData.get("username") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
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

        setError(fieldMessage || data.error || "Unable to create your account.");
        return;
      }

      const email = encodeURIComponent(payload.email);
      router.push(`/login?created=1&email=${email}`);
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
        <h2>Create your account</h2>
        <p>Your space starts with a few simple details.</p>
      </div>

      {error && (
        <div className="auth-alert error" role="alert">
          <span aria-hidden="true">!</span>
          {error}
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field-grid">
          <label className="auth-field">
            <span>Name</span>
            <input
              type="text"
              name="name"
              placeholder="Your name"
              autoComplete="name"
              minLength={2}
              maxLength={50}
              required
            />
          </label>

          <label className="auth-field">
            <span>Username</span>
            <div className="auth-prefix-input">
              <span>@</span>
              <input
                type="text"
                name="username"
                placeholder="username"
                autoComplete="username"
                minLength={3}
                maxLength={30}
                pattern="[A-Za-z0-9_]+"
                title="Use letters, numbers, and underscores only."
                required
              />
            </div>
          </label>
        </div>

        <label className="auth-field">
          <span>Email</span>
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            autoComplete="email"
            inputMode="email"
            required
          />
        </label>

        <div className="auth-field-grid">
          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
            />
          </label>

          <label className="auth-field">
            <span>Confirm password</span>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Repeat password"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
            />
          </label>
        </div>

        <p className="auth-helper-copy">
          Username can contain letters, numbers, and underscores. Password must be 8–72 characters.
        </p>

        <button className="auth-primary-btn" type="submit" disabled={pending}>
          {pending ? (
            <>
              <span className="auth-spinner" aria-hidden="true" />
              Creating account…
            </>
          ) : (
            <>
              Create account
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
