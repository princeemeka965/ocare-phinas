import { NextRequest, NextResponse } from "next/server";

import { supabase } from "@/lib/supabase";
import { hashOtp } from "@/lib/auth/password";
import { jsonError } from "@/lib/auth/guards";
import { sendEmail, otpEmail } from "@/lib/email";
import { registrationSchema, normalizeEmail, duplicateAccountError } from "@/lib/auth/registration";

const OTP_TTL_MINUTES = 10;

/**
 * POST /api/auth/register — step 1 of sign-up. Validates the details, ensures
 * the email/phone are free, then emails a 6-digit code. The account is NOT
 * created here — that happens in /api/auth/register/verify once the code is
 * confirmed, so unverified emails never produce accounts.
 */
export async function POST(req: NextRequest) {
  const parsed = registrationSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Invalid registration details.");

  const email = normalizeEmail(parsed.data.email);
  const phone = parsed.data.phone;

  const dupError = await duplicateAccountError(email, phone);
  if (dupError) return dupError;

  const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
  await supabase.from("OtpCode").insert({
    email,
    purpose: "register",
    codeHash: await hashOtp(code),
    expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000).toISOString(),
  });

  try {
    await sendEmail({ to: email, ...otpEmail(code) });
  } catch (err) {
    console.error("[register] OTP email failed", err);
    return jsonError(502, "We couldn't send your verification email. Please try again.");
  }

  // In non-production, return the code so local/preview sign-up works without an
  // email provider (mirrors the SMS OTP dev convention).
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.json({ ok: true, devCode: code });
  }
  return NextResponse.json({ ok: true });
}
