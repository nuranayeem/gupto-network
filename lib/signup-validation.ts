import { z } from "zod";

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 50;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;
export const GMAIL_LOCAL_MIN_LENGTH = 6;
export const GMAIL_LOCAL_MAX_LENGTH = 30;

const englishNamePattern = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
const usernameCharactersPattern = /^[A-Za-z0-9_]+$/;
const usernameHasLetterPattern = /[A-Za-z]/;
const printableAsciiPasswordPattern = /^[\x21-\x7E]+$/;
const uppercasePattern = /[A-Z]/;
const lowercasePattern = /[a-z]/;
const numberPattern = /[0-9]/;
const specialCharacterPattern = /[^A-Za-z0-9]/;
const strictGmailPattern = /^[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*@gmail\.com$/i;

export function isStrictGmailAddress(value: string) {
  const normalized = value.trim().toLowerCase();

  if (!strictGmailPattern.test(normalized)) {
    return false;
  }

  const localPart = normalized.slice(0, -"@gmail.com".length);

  return (
    localPart.length >= GMAIL_LOCAL_MIN_LENGTH &&
    localPart.length <= GMAIL_LOCAL_MAX_LENGTH
  );
}

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(NAME_MIN_LENGTH, "Name must be at least 2 characters.")
    .max(NAME_MAX_LENGTH, "Name must be 50 characters or fewer.")
    .regex(
      englishNamePattern,
      "Name can contain English letters and single spaces only."
    ),

  username: z
    .string()
    .trim()
    .min(USERNAME_MIN_LENGTH, "Username must be at least 3 characters.")
    .max(USERNAME_MAX_LENGTH, "Username must be 30 characters or fewer.")
    .regex(
      usernameCharactersPattern,
      "Username can contain English letters, numbers, and underscores only."
    )
    .refine(
      (value) => usernameHasLetterPattern.test(value),
      "Username must contain at least one English letter."
    )
    .transform((value) => value.toLowerCase()),

  email: z
    .string()
    .trim()
    .transform((value) => value.toLowerCase())
    .refine(
      isStrictGmailAddress,
      "Enter a Gmail address using only letters, numbers, and single periods before @gmail.com. Gmail aliases such as +tag are not allowed."
    ),

  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, "Password must be at least 8 characters.")
    .max(PASSWORD_MAX_LENGTH, "Password must be 72 characters or fewer.")
    .refine(
      (value) => printableAsciiPasswordPattern.test(value),
      "Password can use standard English/ASCII characters only and cannot contain spaces."
    )
    .refine(
      (value) => uppercasePattern.test(value),
      "Password must include at least one capital letter."
    )
    .refine(
      (value) => lowercasePattern.test(value),
      "Password must include at least one small letter."
    )
    .refine(
      (value) => numberPattern.test(value),
      "Password must include at least one number."
    )
    .refine(
      (value) => specialCharacterPattern.test(value),
      "Password must include at least one special character."
    ),
});

export const verifySignupOtpSchema = z.object({
  requestId: z.string().trim().min(1, "Verification request is missing."),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit verification code."),
});

export const resendSignupOtpSchema = z.object({
  requestId: z.string().trim().min(1, "Verification request is missing."),
});

export type SignupInput = z.infer<typeof signupSchema>;
