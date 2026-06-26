import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { supabase, unwrap } from "@/lib/supabase";
import { requireAdmin, jsonError } from "@/lib/auth/guards";
import type { Customer } from "@/lib/db/types";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({ blocked: z.boolean() });

// PATCH /api/admin/customers/:id/block — block / unblock a customer.
// Phase 3 auth already rejects blocked customers on every request (effectively
// signing them out everywhere).
export async function PATCH(req: NextRequest, { params }: Params) {
  const gate = await requireAdmin("customers");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "A boolean `blocked` is required.");

  const { data: customer } = await supabase.from("Customer").select("id").eq("id", id).maybeSingle();
  if (!customer) return jsonError(404, "Customer not found.");

  const updated = unwrap(
    await supabase.from("Customer").update({ blocked: parsed.data.blocked }).eq("id", id).select("*").single(),
  ) as Customer;
  return NextResponse.json({ blocked: updated.blocked });
}
