import { NextRequest, NextResponse } from "next/server";

import { supabase, unwrap } from "@/lib/supabase";
import { requireAdmin, jsonError } from "@/lib/auth/guards";
import type { Order, OrderItem, Product } from "@/lib/db/types";

type Params = { params: Promise<{ id: string }> };

// POST /api/admin/orders/:id/confirm — confirm an OUTRIGHT order's manual payment.
// Decrements stock (the only place store stock changes). Idempotent.
export async function POST(_req: NextRequest, { params }: Params) {
  const gate = await requireAdmin("orders");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const { data: order } = await supabase
    .from("Order")
    .select("*, items:OrderItem(*)")
    .eq("id", id)
    .maybeSingle<Order & { items: OrderItem[] }>();
  if (!order) return jsonError(404, "Order not found.");
  if (order.paymentPlan !== "outright") return jsonError(400, "Plan orders are confirmed per period.");

  // Idempotent: already moved on.
  if (["confirmed", "processing", "shipped", "delivered"].includes(order.status)) {
    return NextResponse.json({ order });
  }
  if (order.status === "cancelled") return jsonError(409, "This order was cancelled.");

  // Validate all lines have stock BEFORE decrementing any, so a shortfall on a
  // later item never leaves earlier items partially decremented.
  const lines = order.items.filter((i) => i.productId);
  for (const item of lines) {
    const { data: product } = await supabase
      .from("Product")
      .select("id,stockQuantity")
      .eq("id", item.productId!)
      .maybeSingle<Pick<Product, "id" | "stockQuantity">>();
    if (!product || product.stockQuantity < item.qty) {
      return jsonError(409, `Insufficient stock for "${item.name}".`);
    }
  }
  for (const item of lines) {
    await supabase.rpc("inc_product_stock", { p_id: item.productId!, delta: -item.qty });
  }

  const updated = unwrap(
    await supabase.from("Order").update({ status: "processing" }).eq("id", id).select("*").single(),
  ) as Order;
  return NextResponse.json({ order: updated });
}
