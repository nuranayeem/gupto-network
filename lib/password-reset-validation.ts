import { z } from "zod";
import { isStrictGmailAddress } from "@/lib/signup-validation";

const printableAsciiPasswordPattern = /^[\x21-\x7E]+$/;
const uppercasePattern = /[A-Z]/;
const lowercasePattern = /[a-z]/;
const numberPattern = /[0-9]/;
const specialCharacterPattern = /[^A-Za-z0-9]/;

export const passwordResetEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .transform((value) => value.toLowerCase())
    .refine(
      isStrictGmailAddress,
      "Enter a valid Gmail address using letters, numbers, or single periods only."
    ),
});

const resetPasswordValueSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be 72 characters or fewer.")
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
  );

export const startPasswordResetSchema = passwordResetEmailSchema;

export const passwordResetRequestSchema = z.object({
  requestId: z.string().trim().min(1, "Password reset request is missing."),
});

export const verifyPasswordResetOtpSchema = z.object({
  requestId: z.string().trim().min(1, "Password reset request is missing."),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit verification code."),
});

export const completePasswordResetSchema = z
  .object({
    requestId: z.string().trim().min(1, "Password reset request is missing."),
    password: resetPasswordValueSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export function validateResetPasswordValue(value: string) {
  const parsed = resetPasswordValueSchema.safeParse(value);
  return parsed.success
    ? { valid: true as const, message: "Password meets all requirements." }
    : {
        valid: false as const,
        message: parsed.error.issues[0]?.message || "Enter a valid password.",
      };
}
