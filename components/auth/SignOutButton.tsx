"use client";

import { useFormStatus } from "react-dom";
import { logoutAction } from "@/app/auth-actions";

type SignOutButtonProps = {
  compact?: boolean;
};

function SubmitButton({ compact = false }: SignOutButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={`signout-btn${compact ? " compact" : ""}`}
      disabled={pending}
      aria-label={pending ? "Signing out" : "Sign out"}
      title="Sign out"
    >
      {pending ? (
        <span className="auth-spinner small" aria-hidden="true" />
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M10 17l5-5-5-5" />
          <path d="M15 12H3" />
          <path d="M14 3h4a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-4" />
        </svg>
      )}
      {!compact && <span>{pending ? "Signing out…" : "Sign out"}</span>}
    </button>
  );
}

export default function SignOutButton({ compact = false }: SignOutButtonProps) {
  return (
    <form action={logoutAction} className={`signout-form${compact ? " compact" : ""}`}>
      <SubmitButton compact={compact} />
    </form>
  );
}
