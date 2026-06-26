import { NextRequest, NextResponse } from "next/server";

import { supabase } from "@/lib/supabase";
import { requireCustomer, jsonError } from "@/lib/auth/guards";
import type { Order } from "@/lib/db/types";

type Params = { params: Promise<{ id: string }> };

// GET /api/orders/:id — the customer's own order.
export async function GET(_req: NextRequest, { params }: Params) {
  const gate = await requireCustomer();
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const { data: order } = await supabase
    .from("Order")
    .select("*, items:OrderItem(*), plan:Plan(*)")
    .eq("id", id)
    .maybeSingle<Order & { customerId: string }>();
  if (!order || order.customerId !== gate.customer.id) return jsonError(404, "Order not found.");
  return NextResponse.json({ order });
}
