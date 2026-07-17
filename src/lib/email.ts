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

/** Escape HTML special characters — templates below interpolate admin/customer-entered text. */
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Solar installation scheduled/rescheduled — includes the admin's notes, if any. */
export function solarInstallationScheduledEmail(input: {
  customerName: string;
  date: string;
  time: string;
  notes?: string | null;
}): { subject: string; html: string; text: string } {
  const { customerName, date, time, notes } = input;
  const formattedDate = new Date(date).toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const subject = "Your solar installation is scheduled";
  const text =
    `Hi ${customerName}, your OCare Phinas solar installation has been scheduled for ${formattedDate} at ${time}.` +
    (notes ? `\n\nNote from our team: ${notes}` : "");
  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h1 style="font-size:20px;margin:0 0 8px">Installation scheduled</h1>
      <p style="color:#475569;font-size:14px;margin:0 0 20px">Hi ${escapeHtml(customerName)}, your solar installation has been scheduled.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin-bottom:16px">
        <p style="margin:0 0 4px;font-size:14px;color:#065f46"><strong>Date:</strong> ${escapeHtml(formattedDate)}</p>
        <p style="margin:0;font-size:14px;color:#065f46"><strong>Time:</strong> ${escapeHtml(time)}</p>
      </div>
      ${
        notes
          ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:16px">
        <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#334155">Note from our team</p>
        <p style="margin:0;font-size:14px;color:#475569">${escapeHtml(notes)}</p>
      </div>`
          : ""
      }
      <p style="color:#94a3b8;font-size:12px;margin:20px 0 0">
        If you have any questions, reply on WhatsApp or contact support.
      </p>
    </div>`;
  return { subject, html, text };
}

/** Password reset link — sent when a customer requests one from /forgot-password. */
export function passwordResetEmail(link: string): { subject: string; html: string; text: string } {
  const subject = "Reset your OCare Phinas password";
  const text = `We received a request to reset your OCare Phinas password. Use this link to choose a new one: ${link}\n\nThis link expires in 30 minutes. If you didn't request this, you can ignore this email — your password won't change.`;
  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h1 style="font-size:20px;margin:0 0 8px">Reset your password</h1>
      <p style="color:#475569;font-size:14px;margin:0 0 20px">
        We received a request to reset your OCare Phinas password. Click below to choose a new one.
      </p>
      <p style="text-align:center;margin:0 0 20px">
        <a href="${escapeHtml(link)}" style="display:inline-block;background:#065f46;color:#fff;text-decoration:none;
                  font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px">Reset password</a>
      </p>
      <p style="color:#94a3b8;font-size:12px;margin:0">
        This link expires in 30 minutes. If you didn't request it, you can ignore this email — your password won't change.
      </p>
    </div>`;
  return { subject, html, text };
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
