import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { supabase, unwrap } from "@/lib/supabase";
import { hashPassword } from "@/lib/auth/password";
import { signSession, sessionCookie, CUSTOMER_COOKIE } from "@/lib/auth/session";
import { publicCustomer } from "@/lib/auth/serialize";
import { jsonError } from "@/lib/auth/guards";
import type { Customer } from "@/lib/db/types";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Invalid registration details.");
  const { name, email, phone, password } = parsed.data;

  // Block list is keyed on phone + email (survives re-registration — spec B9).
  const dup = unwrap(
    await supabase.from("Customer").select("id,blocked").or(`email.eq."${email}",phone.eq."${phone}"`).limit(1),
  ) as { id: string; blocked: boolean }[];
  if (dup[0]) {
    if (dup[0].blocked) return jsonError(403, "This account is suspended — contact support.");
    return jsonError(409, "An account with this email or phone already exists.");
  }

  const customer = unwrap(
    await supabase
      .from("Customer")
      .insert({ name, email, phone, passwordHash: await hashPassword(password) })
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
