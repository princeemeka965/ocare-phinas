import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { supabase, unwrap } from "@/lib/supabase";
import { hashPassword, verifyOtp } from "@/lib/auth/password";
import { signSession, sessionCookie, CUSTOMER_COOKIE } from "@/lib/auth/session";
import { publicCustomer } from "@/lib/auth/serialize";
import { jsonError } from "@/lib/auth/guards";
import { registrationSchema, normalizeEmail, duplicateAccountError } from "@/lib/auth/registration";
import type { Customer, OtpCode } from "@/lib/db/types";

const schema = registrationSchema.extend({ code: z.string().length(6) });

const MAX_ATTEMPTS = 5;

/**
 * POST /api/auth/register/verify — step 2 of sign-up. Confirms the emailed code,
 * then creates the customer (email verified) + wallet and signs them in.
 */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Invalid details or code.");

  const { name, password, code } = parsed.data;
  const email = normalizeEmail(parsed.data.email);
  const phone = parsed.data.phone;

  // Re-check duplicates here too (someone may have registered between steps).
  const dupError = await duplicateAccountError(email, phone);
  if (dupError) return dupError;

  const rows = unwrap(
    await supabase
      .from("OtpCode")
      .select("*")
      .eq("email", email)
      .eq("purpose", "register")
      .is("consumedAt", null)
      .gt("expiresAt", new Date().toISOString())
      .order("createdAt", { ascending: false })
      .limit(1),
  ) as OtpCode[];
  const otp = rows[0];
  if (!otp || otp.attempts >= MAX_ATTEMPTS) {
    return jsonError(400, "Code expired or invalid. Request a new one.");
  }

  if (!(await verifyOtp(code, otp.codeHash))) {
    await supabase.from("OtpCode").update({ attempts: otp.attempts + 1 }).eq("id", otp.id);
    return jsonError(400, "Incorrect code.");
  }

  await supabase.from("OtpCode").update({ consumedAt: new Date().toISOString() }).eq("id", otp.id);

  const customer = unwrap(
    await supabase
      .from("Customer")
      .insert({ name: name.trim(), email, phone, passwordHash: await hashPassword(password), emailVerified: true })
      .select("*")
      .single(),
  ) as Customer;
  // The wallet is created alongside the customer (1:1).
  await supabase.from("Wallet").insert({ customerId: customer.id });

  const token = await signSession({ sub: customer.id, kind: "customer" });
  const res = NextResponse.json({ customer: publicCustomer(customer) }, { status: 201 });
  res.cookies.set(sessionCookie(CUSTOMER_COOKIE, token));
  return res;
}
