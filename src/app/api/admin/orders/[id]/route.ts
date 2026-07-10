import { NextRequest, NextResponse } from "next/server";

import { supabase } from "@/lib/supabase";
import { requireAdmin, jsonError } from "@/lib/auth/guards";
import { planPeriods, paymentHealth } from "@/lib/payment-health";
import { reversePlan } from "@/lib/server/lifecycle";
import type { Order, OrderItem, Plan, PlanPayment } from "@/lib/db/types";

type Params = { params: Promise<{ id: string }> };

// GET /api/admin/orders/:id — full order; for plan orders also the payment
// schedule (periods) and arrears health, derived from the kept helpers.
export async function GET(_req: NextRequest, { params }: Params) {
  const gate = await requireAdmin("orders");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const { data: order } = await supabase
    .from("Order")
    .select("*, customer:Customer(name,email,phone), items:OrderItem(*), plan:Plan(*, payments:PlanPayment(*))")
    .eq("id", id)
    .maybeSingle<Order & { plan: (Plan & { payments: PlanPayment[] }) | null }>();
  if (!order) return jsonError(404, "Order not found.");

  let periods = null;
  let health = null;
  if (order.plan) {
    const p = order.plan;
    const paidIndices = p.payments.map((pp) => pp.periodIndex);
    // Schedule collects the product price plus any door-delivery fee.
    const scheduleTotal = p.productPrice + p.deliveryFee;
    const startDate = new Date(p.startDate).toISOString();
    periods = planPeriods({
      price: scheduleTotal, perPayment: p.perPayment, frequency: p.frequency,
      startDate, paidIndices,
    });
    const amountPaid = p.payments.reduce((s, pp) => s + pp.amount, 0);
    health = paymentHealth({
      price: scheduleTotal, amountPaid, perPayment: p.perPayment, frequency: p.frequency,
      startDate,
    });
  }

  return NextResponse.json({ order, periods, health });
}

// DELETE /api/admin/orders/:id — outright orders reverse any decremented
// stock inline and delete straight away. Solo/Group orders are blocked once
// their plan has a confirmed payment (amountAllocated > 0) — the plan must
// be deleted first (DELETE /api/admin/plans/:id), which reverses wallet/
// stock/group effects; a fresh, never-paid plan is reversed and removed here.
export async function DELETE(_req: NextRequest, { params }: Params) {
  const gate = await requireAdmin("orders");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const { data: order } = await supabase
    .from("Order")
    .select("*, items:OrderItem(*), plan:Plan(*)")
    .eq("id", id)
    .maybeSingle<Order & { items: OrderItem[]; plan: Plan | null }>();
  if (!order) return jsonError(404, "Order not found.");

  try {
    if (order.plan) {
      if (order.plan.amountAllocated > 0) {
        return jsonError(409, "This order has confirmed payments. Delete the plan first, then delete the order.");
      }
      await reversePlan(order.plan);
    } else if (["processing", "shipped", "delivered"].includes(order.status)) {
      // Outright — stock was decremented at confirm; restore it before deleting.
      for (const item of order.items) {
        if (item.productId) await supabase.rpc("inc_product_stock", { p_id: item.productId, delta: item.qty });
      }
    }
  } catch (err) {
    return jsonError(500, err instanceof Error ? err.message : "Couldn't delete the order.");
  }

  await supabase.from("Order").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
