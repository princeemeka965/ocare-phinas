import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { supabase, unwrap } from "@/lib/supabase";
import { verifyPassword } from "@/lib/auth/password";
import { signSession, sessionCookie, CUSTOMER_COOKIE } from "@/lib/auth/session";
import { publicCustomer } from "@/lib/auth/serialize";
import { jsonError } from "@/lib/auth/guards";
import type { Customer } from "@/lib/db/types";

const schema = z.object({
  emailOrPhone: z.string().min(3),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Email/phone and password are required.");
  const { emailOrPhone, password } = parsed.data;

  const rows = unwrap(
    await supabase
      .from("Customer")
      .select("*")
      .or(`email.eq."${emailOrPhone}",phone.eq."${emailOrPhone}"`)
      .limit(1),
  ) as Customer[];
  const customer = rows[0];
  // Same response whether the account is missing or the password is wrong.
  if (!customer || !(await verifyPassword(password, customer.passwordHash))) {
    return jsonError(401, "Invalid credentials.");
  }
  if (customer.blocked) return jsonError(403, "This account is suspended — contact support.");

  const token = await signSession({ sub: customer.id, kind: "customer" });
  const res = NextResponse.json({ customer: publicCustomer(customer) });
  res.cookies.set(sessionCookie(CUSTOMER_COOKIE, token));
  return res;
}
