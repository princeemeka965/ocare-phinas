import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { supabase, unwrap } from "@/lib/supabase";
import { requireAdmin, jsonError } from "@/lib/auth/guards";
import type { Order } from "@/lib/db/types";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({ status: z.enum(["processing", "shipped", "delivered", "cancelled"]) });

// PATCH /api/admin/orders/:id/status — fulfilment status, only after the order
// has been confirmed (outright) or reached its threshold (plan → processing).
export async function PATCH(req: NextRequest, { params }: Params) {
  const gate = await requireAdmin("orders");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Invalid status.");

  const { data: order } = await supabase.from("Order").select("*").eq("id", id).maybeSingle<Order>();
  if (!order) return jsonError(404, "Order not found.");
  if (["pending_payment", "payment_submitted", "in_plan"].includes(order.status)) {
    return jsonError(409, "Confirm the payment / reach the plan threshold before updating fulfilment.");
  }

  const updated = unwrap(
    await supabase.from("Order").update({ status: parsed.data.status }).eq("id", id).select("*").single(),
  ) as Order;
  return NextResponse.json({ order: updated });
}
