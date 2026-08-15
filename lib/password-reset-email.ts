type SendPasswordResetOtpInput = {
  to: string;
  code: string;
};

export type PasswordResetDeliveryMode = "console" | "resend";

export class PasswordResetEmailConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PasswordResetEmailConfigurationError";
  }
}

export function getPasswordResetDeliveryMode(): PasswordResetDeliveryMode {
  const configuredMode = (
    process.env.PASSWORD_RESET_EMAIL_MODE || process.env.SIGNUP_EMAIL_MODE
  )
    ?.trim()
    .toLowerCase();

  if (configuredMode === "console" || configuredMode === "resend") {
    return configuredMode;
  }

  return process.env.NODE_ENV === "production" ? "resend" : "console";
}

function printLocalPasswordResetOtp({ to, code }: SendPasswordResetOtpInput) {
  console.log("");
  console.log("============================================================");
  console.log("GUPTO LOCAL PASSWORD RESET OTP");
  console.log(`Gmail: ${to}`);
  console.log(`OTP:   ${code}`);
  console.log("Valid for: 10 minutes");
  console.log("Use this code on /verify-reset in your local browser.");
  console.log("============================================================");
  console.log("");
}

export async function sendPasswordResetOtp({
  to,
  code,
}: SendPasswordResetOtpInput) {
  const deliveryMode = getPasswordResetDeliveryMode();

  if (deliveryMode === "console") {
    printLocalPasswordResetOtp({ to, code });
    return { deliveryMode } as const;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    throw new PasswordResetEmailConfigurationError(
      "Password reset email delivery is enabled, but RESEND_API_KEY or EMAIL_FROM is missing."
    );
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Your Gupto password reset code",
      text: `Your Gupto password reset code is ${code}. It expires in 10 minutes. If you did not request a password reset, you can ignore this email.`,
      html: `
        <div style="font-family:Arial,sans-serif;background:#f7f7fb;padding:32px 16px;color:#17171f">
          <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #ececf4;border-radius:20px;padding:32px">
            <div style="font-size:24px;font-weight:800;color:#6f4cff;margin-bottom:18px">Gupto</div>
            <h1 style="font-size:22px;line-height:1.3;margin:0 0 10px">Reset your password</h1>
            <p style="font-size:14px;line-height:1.7;color:#6f7080;margin:0 0 22px">
              Use this 6-digit code to continue resetting your Gupto password.
            </p>
            <div style="font-size:34px;font-weight:800;letter-spacing:8px;text-align:center;background:#f5f2ff;color:#5f3df5;border-radius:16px;padding:20px;margin-bottom:22px">
              ${code}
            </div>
            <p style="font-size:13px;line-height:1.7;color:#6f7080;margin:0">
              This code expires in 10 minutes. Never share it with anyone.
            </p>
          </div>
        </div>
      `,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    let providerMessage = "Email provider rejected the request.";

    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) providerMessage = body.message;
    } catch {
      // Keep the generic provider error.
    }

    throw new Error(providerMessage);
  }

  return { deliveryMode } as const;
}
