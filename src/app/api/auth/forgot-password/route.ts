import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";

import { supabase } from "@/lib/supabase";
import { hashOtp } from "@/lib/auth/password";
import { jsonError } from "@/lib/auth/guards";
import { sendEmail, passwordResetEmail } from "@/lib/email";
import { normalizeEmail } from "@/lib/auth/registration";
import type { Customer } from "@/lib/db/types";

const schema = z.object({ email: z.string().email() });

const RESET_TTL_MINUTES = 30;

/**
 * POST /api/auth/forgot-password — always responds { ok: true } regardless of
 * whether the email matches an account, so the response can't be used to
 * enumerate registered emails.
 */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "A valid email address is required.");

  const email = normalizeEmail(parsed.data.email);
  const { data: customer } = await supabase
    .from("Customer")
    .select("id,blocked")
    .eq("email", email)
    .maybeSingle<Pick<Customer, "id" | "blocked">>();

  if (customer && !customer.blocked) {
    const token = crypto.randomBytes(32).toString("hex");
    await supabase.from("OtpCode").insert({
      email,
      purpose: "password_reset",
      codeHash: await hashOtp(token),
      expiresAt: new Date(Date.now() + RESET_TTL_MINUTES * 60_000).toISOString(),
    });

    const link = `${req.nextUrl.origin}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    try {
      await sendEmail({ to: email, ...passwordResetEmail(link) });
    } catch (err) {
      // Don't leak delivery failures to the client either — enumeration-safe.
      console.error("[forgot-password] email failed", err);
    }
  }

  if (process.env.NODE_ENV !== "production") {
    return NextResponse.json({ ok: true, devHint: customer && !customer.blocked ? "check server console for the link" : "no account for this email" });
  }
  return NextResponse.json({ ok: true });
}
