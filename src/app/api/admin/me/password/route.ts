import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { supabase } from "@/lib/supabase";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { requireAdmin, jsonError } from "@/lib/auth/guards";
import type { AdminUser } from "@/lib/db/types";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

// Available to ANY signed-in admin — no area permission required (payment-flow §15.4).
export async function PATCH(req: NextRequest) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Current password and a new password (8+ chars) are required.");
  const { currentPassword, newPassword } = parsed.data;

  const { data: admin } = await supabase
    .from("AdminUser")
    .select("*")
    .eq("id", gate.admin.id)
    .maybeSingle<AdminUser>();
  if (!admin || !(await verifyPassword(currentPassword, admin.passwordHash))) {
    return jsonError(400, "Your current password is incorrect.");
  }

  await supabase
    .from("AdminUser")
    .update({ passwordHash: await hashPassword(newPassword), mustChangePassword: false })
    .eq("id", admin.id);
  return NextResponse.json({ ok: true });
}
