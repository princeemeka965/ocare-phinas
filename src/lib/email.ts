/* Transactional email — server only.
 *
 * Uses Resend's HTTP API when RESEND_API_KEY is set (no SDK dependency, just
 * fetch). With no key configured the message is logged to the server console
 * instead of sent, so local development and previews work without a provider —
 * the same convention the SMS OTP flow uses. Set EMAIL_FROM to a verified
 * sender (e.g. "OCare Phinas <no-reply@ocarephinas.com>").
 */

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail({ to, subject, html, text }: SendEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "OCare Phinas <onboarding@resend.dev>";

  if (!apiKey) {
    // Dev / unconfigured: don't fail the request, just surface the email.
    console.info(`[email] (no RESEND_API_KEY) to=${to} subject=${subject}\n${text ?? html}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Email send failed (${res.status}): ${detail}`);
  }
}

/** Branded sign-up verification email for a 6-digit code. */
export function otpEmail(code: string): { subject: string; html: string; text: string } {
  const subject = "Your OCare Phinas verification code";
  const text = `Your OCare Phinas verification code is ${code}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`;
  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h1 style="font-size:20px;margin:0 0 8px">Verify your email</h1>
      <p style="color:#475569;font-size:14px;margin:0 0 20px">
        Use this code to finish creating your OCare Phinas account.
      </p>
      <div style="font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;
                  background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;color:#065f46">
        ${code}
      </div>
      <p style="color:#94a3b8;font-size:12px;margin:20px 0 0">
        This code expires in 10 minutes. If you didn't request it, you can ignore this email.
      </p>
    </div>`;
  return { subject, html, text };
}
