import { createHmac, randomBytes, randomInt, timingSafeEqual } from "crypto";

export const PASSWORD_RESET_OTP_LENGTH = 6;
export const PASSWORD_RESET_OTP_TTL_MINUTES = 10;
export const PASSWORD_RESET_SESSION_TTL_MINUTES = 30;
export const PASSWORD_RESET_TOKEN_TTL_MINUTES = 15;
export const PASSWORD_RESET_RESEND_COOLDOWN_SECONDS = 60;
export const PASSWORD_RESET_MAX_ATTEMPTS = 5;
export const PASSWORD_RESET_MAX_RESENDS = 5;

function getResetSecret() {
  const secret = process.env.OTP_SECRET || process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("Password reset secret is not configured.");
  }

  return secret;
}

export function generatePasswordResetOtp() {
  const minimum = 10 ** (PASSWORD_RESET_OTP_LENGTH - 1);
  const maximum = 10 ** PASSWORD_RESET_OTP_LENGTH;
  return String(randomInt(minimum, maximum));
}

export function hashPasswordResetOtp(requestId: string, code: string) {
  return createHmac("sha256", getResetSecret())
    .update(`password-reset:${requestId}:${code}`)
    .digest("hex");
}

export function passwordResetOtpMatches(
  requestId: string,
  code: string,
  expectedHash: string
) {
  const actualHash = hashPasswordResetOtp(requestId, code);
  const actualBuffer = Buffer.from(actualHash, "hex");
  const expectedBuffer = Buffer.from(expectedHash, "hex");

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
}

export function generatePasswordResetToken() {
  return randomBytes(32).toString("hex");
}

export function hashPasswordResetToken(token: string) {
  return createHmac("sha256", getResetSecret())
    .update(`password-reset-token:${token}`)
    .digest("hex");
}

export function addResetMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

export function addResetSeconds(date: Date, seconds: number) {
  return new Date(date.getTime() + seconds * 1_000);
}

export function resetSecondsUntil(date: Date) {
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 1_000));
}

export function maskResetEmail(email: string) {
  const [localPart, domain] = email.split("@");

  if (!localPart || !domain) {
    return email;
  }

  const visibleStart = localPart.slice(0, Math.min(2, localPart.length));
  const hiddenCount = Math.max(3, localPart.length - visibleStart.length);
  return `${visibleStart}${"•".repeat(hiddenCount)}@${domain}`;
}
