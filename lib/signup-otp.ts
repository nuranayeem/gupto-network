import { createHmac, randomInt, timingSafeEqual } from "crypto";

export const OTP_LENGTH = 6;
export const OTP_TTL_MINUTES = 10;
export const SIGNUP_SESSION_TTL_MINUTES = 30;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_MAX_RESENDS = 5;

function getOtpSecret() {
  const secret = process.env.OTP_SECRET || process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("OTP secret is not configured.");
  }

  return secret;
}

export function generateSignupOtp() {
  const minimum = 10 ** (OTP_LENGTH - 1);
  const maximum = 10 ** OTP_LENGTH;

  return String(randomInt(minimum, maximum));
}

export function hashSignupOtp(requestId: string, code: string) {
  return createHmac("sha256", getOtpSecret())
    .update(`${requestId}:${code}`)
    .digest("hex");
}

export function signupOtpMatches(
  requestId: string,
  code: string,
  expectedHash: string
) {
  const actualHash = hashSignupOtp(requestId, code);
  const actualBuffer = Buffer.from(actualHash, "hex");
  const expectedBuffer = Buffer.from(expectedHash, "hex");

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
}

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

export function addSeconds(date: Date, seconds: number) {
  return new Date(date.getTime() + seconds * 1_000);
}

export function secondsUntil(date: Date) {
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 1_000));
}

export function maskEmail(email: string) {
  const [localPart, domain] = email.split("@");

  if (!localPart || !domain) {
    return email;
  }

  const visibleStart = localPart.slice(0, Math.min(2, localPart.length));
  const hiddenCount = Math.max(3, localPart.length - visibleStart.length);

  return `${visibleStart}${"•".repeat(hiddenCount)}@${domain}`;
}
