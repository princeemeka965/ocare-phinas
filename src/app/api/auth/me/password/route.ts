import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { supabase } from "@/lib/supabase";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { requireCustomer, jsonError } from "@/lib/auth/guards";
import type { Customer } from "@/lib/db/types";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

// Mirrors /api/admin/me/password — the customer analog on /profile's Security form.
export async function PATCH(req: NextRequest) {
  const gate = await requireCustomer();
  if ("response" in gate) return gate.response;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Current password and a new password (8+ chars) are required.");
  const { currentPassword, newPassword } = parsed.data;

  const { data: customer } = await supabase
    .from("Customer")
    .select("*")
    .eq("id", gate.customer.id)
    .maybeSingle<Customer>();
  if (!customer || !(await verifyPassword(currentPassword, customer.passwordHash))) {
    return jsonError(400, "Your current password is incorrect.");
  }

  await supabase.from("Customer").update({ passwordHash: await hashPassword(newPassword) }).eq("id", customer.id);
  return NextResponse.json({ ok: true });
}
