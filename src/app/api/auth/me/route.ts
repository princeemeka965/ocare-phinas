import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { supabase, unwrap } from "@/lib/supabase";
import { currentCustomer, requireCustomer, jsonError } from "@/lib/auth/guards";
import { publicCustomer } from "@/lib/auth/serialize";
import type { Customer } from "@/lib/db/types";

export async function GET() {
  const customer = await currentCustomer();
  if (!customer) return NextResponse.json({ customer: null });
  return NextResponse.json({ customer: publicCustomer(customer) });
}

const patchSchema = z
  .object({ name: z.string().min(2), email: z.string().email(), phone: z.string().min(7) })
  .partial();

export async function PATCH(req: NextRequest) {
  const gate = await requireCustomer();
  if ("response" in gate) return gate.response;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Invalid profile details.");
  const { name, email, phone } = parsed.data;

  // Guard uniqueness when email/phone change.
  if (email && email !== gate.customer.email) {
    const { data } = await supabase.from("Customer").select("id").eq("email", email).neq("id", gate.customer.id).maybeSingle();
    if (data) return jsonError(409, "That email is already in use.");
  }
  if (phone && phone !== gate.customer.phone) {
    const { data } = await supabase.from("Customer").select("id").eq("phone", phone).neq("id", gate.customer.id).maybeSingle();
    if (data) return jsonError(409, "That phone number is already in use.");
  }

  const phoneChanged = phone !== undefined && phone !== gate.customer.phone;
  const customer = unwrap(
    await supabase
      .from("Customer")
      .update({
        ...(name !== undefined ? { name } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(phoneChanged ? { phoneVerified: false } : {}), // re-verify on phone change
      })
      .eq("id", gate.customer.id)
      .select("*")
      .single(),
  ) as Customer;
  return NextResponse.json({ customer: publicCustomer(customer) });
}
