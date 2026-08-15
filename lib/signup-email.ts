type SendSignupOtpEmailInput = {
  to: string;
  code: string;
};

export type SignupOtpDeliveryMode = "console" | "resend";

export class SignupEmailConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SignupEmailConfigurationError";
  }
}

export function getSignupOtpDeliveryMode(): SignupOtpDeliveryMode {
  const configuredMode = process.env.SIGNUP_EMAIL_MODE?.trim().toLowerCase();

  if (configuredMode === "console" || configuredMode === "resend") {
    return configuredMode;
  }

  // Local development works without an external email provider. Production
  // defaults to real email delivery so OTP codes are never exposed in logs by
  // accident after deployment.
  return process.env.NODE_ENV === "production" ? "resend" : "console";
}

function printLocalSignupOtp({ to, code }: SendSignupOtpEmailInput) {
  console.log("");
  console.log("============================================================");
  console.log("GUPTO LOCAL SIGNUP OTP");
  console.log(`Gmail: ${to}`);
  console.log(`OTP:   ${code}`);
  console.log("Valid for: 10 minutes");
  console.log("Use this code on /verify-email in your local browser.");
  console.log("============================================================");
  console.log("");
}

export async function sendSignupOtpEmail({
  to,
  code,
}: SendSignupOtpEmailInput) {
  const deliveryMode = getSignupOtpDeliveryMode();

  if (deliveryMode === "console") {
    printLocalSignupOtp({ to, code });
    return { deliveryMode } as const;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    throw new SignupEmailConfigurationError(
      "Resend email delivery is enabled, but RESEND_API_KEY or EMAIL_FROM is missing."
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
      subject: "Your Gupto verification code",
      text: `Your Gupto verification code is ${code}. It expires in 10 minutes. If you did not request this code, you can ignore this email.`,
      html: `
        <div style="font-family:Arial,sans-serif;background:#f7f7fb;padding:32px 16px;color:#17171f">
          <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #ececf4;border-radius:20px;padding:32px">
            <div style="font-size:24px;font-weight:800;color:#6f4cff;margin-bottom:18px">Gupto</div>
            <h1 style="font-size:22px;line-height:1.3;margin:0 0 10px">Verify your email</h1>
            <p style="font-size:14px;line-height:1.7;color:#6f7080;margin:0 0 22px">
              Use this 6-digit code to finish creating your Gupto account.
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
      if (body.message) {
        providerMessage = body.message;
      }
    } catch {
      // Keep the generic provider error without exposing response internals.
    }

    throw new Error(providerMessage);
  }

  return { deliveryMode } as const;
}
