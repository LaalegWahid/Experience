import "server-only";
import { env } from "@/shared/utils/env";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

/**
 * Sends a transactional email via Resend when configured. When it isn't (or the
 * send fails), the message is logged to the server console so the OTP flow is
 * still testable in development without an email provider.
 */
export async function sendEmail({ to, subject, text, html }: SendEmailInput) {
  const key = env.RESEND_API_KEY;
  if (!env.RESEND_ENABLED || !key) {
    const reason = !env.RESEND_ENABLED ? "RESEND_ENABLED is not true" : "no RESEND_API_KEY";
    console.log(
      `\n✉️  [email:dev] ${reason} — logging instead\n   To: ${to}\n   Subject: ${subject}\n   ${text}\n`,
    );
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM ?? "onboarding@resend.dev",
        to,
        subject,
        text,
        html: html ?? text,
      }),
    });
    if (!res.ok) {
      console.error("[email] Resend send failed:", await res.text());
      console.log(`[email:fallback] To: ${to} — ${text}`);
    }
  } catch (err) {
    console.error("[email] Resend request error:", err);
    console.log(`[email:fallback] To: ${to} — ${text}`);
  }
}
