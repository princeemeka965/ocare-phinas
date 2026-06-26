import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { supabase } from "@/lib/supabase";
import { hashOtp } from "@/lib/auth/password";
import { jsonError } from "@/lib/auth/guards";

const schema = z.object({ phone: z.string().min(7) });

const OTP_TTL_MINUTES = 10;

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "A valid phone number is required.");
  const { phone } = parsed.data;

  const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
  await supabase.from("OtpCode").insert({
    phone,
    codeHash: await hashOtp(code),
    expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000).toISOString(),
  });

  // Phase 3: send `code` via the SMS provider configured in Settings.
  if (process.env.NODE_ENV !== "production") {
    console.info(`[OTP] ${phone} -> ${code}`);
    return NextResponse.json({ ok: true, devCode: code });
  }
  return NextResponse.json({ ok: true });
}
