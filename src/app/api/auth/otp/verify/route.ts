import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { supabase, unwrap } from "@/lib/supabase";
import { verifyOtp } from "@/lib/auth/password";
import { jsonError } from "@/lib/auth/guards";
import type { OtpCode } from "@/lib/db/types";

const schema = z.object({ phone: z.string().min(7), code: z.string().length(6) });

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Phone and a 6-digit code are required.");
  const { phone, code } = parsed.data;

  const rows = unwrap(
    await supabase
      .from("OtpCode")
      .select("*")
      .eq("phone", phone)
      .is("consumedAt", null)
      .gt("expiresAt", new Date().toISOString())
      .order("createdAt", { ascending: false })
      .limit(1),
  ) as OtpCode[];
  const otp = rows[0];
  if (!otp || otp.attempts >= MAX_ATTEMPTS) return jsonError(400, "Code expired or invalid. Request a new one.");

  if (!(await verifyOtp(code, otp.codeHash))) {
    await supabase.from("OtpCode").update({ attempts: otp.attempts + 1 }).eq("id", otp.id);
    return jsonError(400, "Incorrect code.");
  }

  await supabase.from("OtpCode").update({ consumedAt: new Date().toISOString() }).eq("id", otp.id);
  // Mark the matching customer's phone verified, if one exists.
  await supabase.from("Customer").update({ phoneVerified: true }).eq("phone", phone);

  return NextResponse.json({ ok: true });
}
