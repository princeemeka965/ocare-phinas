import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { supabase, unwrap } from "@/lib/supabase";
import { hashPassword, verifyOtp } from "@/lib/auth/password";
import { jsonError } from "@/lib/auth/guards";
import { normalizeEmail } from "@/lib/auth/registration";
import type { Customer, OtpCode } from "@/lib/db/types";

const schema = z.object({
  email: z.string().email(),
  token: z.string().min(20),
  newPassword: z.string().min(8),
});

const MAX_ATTEMPTS = 5;
const INVALID_MESSAGE = "This reset link has expired or already been used. Request a new one.";

/**
 * POST /api/auth/reset-password — consumes the token emailed by
 * /api/auth/forgot-password and sets a new password. Mirrors the
 * register/verify OTP-consumption pattern (latest unconsumed, unexpired row
 * for the email+purpose, capped attempts).
 */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Invalid request.");

  const email = normalizeEmail(parsed.data.email);
  const { token, newPassword } = parsed.data;

  const rows = unwrap(
    await supabase
      .from("OtpCode")
      .select("*")
      .eq("email", email)
      .eq("purpose", "password_reset")
      .is("consumedAt", null)
      .gt("expiresAt", new Date().toISOString())
      .order("createdAt", { ascending: false })
      .limit(1),
  ) as OtpCode[];
  const otp = rows[0];
  if (!otp || otp.attempts >= MAX_ATTEMPTS) {
    return jsonError(400, INVALID_MESSAGE);
  }

  if (!(await verifyOtp(token, otp.codeHash))) {
    await supabase.from("OtpCode").update({ attempts: otp.attempts + 1 }).eq("id", otp.id);
    return jsonError(400, INVALID_MESSAGE);
  }

  await supabase.from("OtpCode").update({ consumedAt: new Date().toISOString() }).eq("id", otp.id);

  const { data: customer } = await supabase
    .from("Customer")
    .select("id,blocked")
    .eq("email", email)
    .maybeSingle<Pick<Customer, "id" | "blocked">>();
  if (!customer || customer.blocked) return jsonError(400, INVALID_MESSAGE);

  await supabase.from("Customer").update({ passwordHash: await hashPassword(newPassword) }).eq("id", customer.id);
  return NextResponse.json({ ok: true });
}
