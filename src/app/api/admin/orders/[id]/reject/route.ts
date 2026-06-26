import { NextRequest, NextResponse } from "next/server";

import { supabase, unwrap } from "@/lib/supabase";
import { requireAdmin, jsonError } from "@/lib/auth/guards";
import type { Order } from "@/lib/db/types";

type Params = { params: Promise<{ id: string }> };

// POST /api/admin/orders/:id/reject — reject an outright order's payment → cancelled.
export async function POST(_req: NextRequest, { params }: Params) {
  const gate = await requireAdmin("orders");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const { data: order } = await supabase.from("Order").select("*").eq("id", id).maybeSingle<Order>();
  if (!order) return jsonError(404, "Order not found.");
  if (!["pending_payment", "payment_submitted"].includes(order.status)) {
    return jsonError(409, "Only an order awaiting confirmation can be rejected.");
  }

  const updated = unwrap(
    await supabase.from("Order").update({ status: "cancelled" }).eq("id", id).select("*").single(),
  ) as Order;
  return NextResponse.json({ order: updated });
}
