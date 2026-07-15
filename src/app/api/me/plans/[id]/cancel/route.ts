import { NextRequest, NextResponse } from "next/server";

import { supabase } from "@/lib/supabase";
import { requireCustomer, jsonError } from "@/lib/auth/guards";
import { cancelPlanForCredit } from "@/lib/server/lifecycle";
import type { Order, Plan } from "@/lib/db/types";

type Params = { params: Promise<{ id: string }> };

// POST /api/me/plans/:id/cancel — customer self-service: cancel a plan that
// hasn't delivered anything yet, turning its paid-in balance into reusable
// wallet credit (see cancelPlanForCredit, src/lib/server/lifecycle.ts). Only
// "active" plans qualify — once goods have changed hands this is a
// repossession question, not a refund one, and stays a manual admin call.
export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const gate = await requireCustomer();
  if ("response" in gate) return gate.response;

  const { data: plan } = await supabase
    .from("Plan")
    .select("*")
    .eq("id", id)
    .eq("customerId", gate.customer.id)
    .maybeSingle<Plan>();
  if (!plan) return jsonError(404, "Plan not found.");
  if (plan.type === "solar") return jsonError(400, "Solar plans can't be cancelled online — contact support.");
  if (plan.status !== "active") {
    return jsonError(409, "This plan can no longer be cancelled online — contact support.");
  }

  const { data: order } = await supabase
    .from("Order")
    .select("id")
    .eq("planId", plan.id)
    .maybeSingle<Pick<Order, "id">>();

  await cancelPlanForCredit(plan);
  if (order) await supabase.from("Order").update({ status: "cancelled" }).eq("id", order.id);

  return NextResponse.json({ ok: true, freedAmount: plan.amountAllocated });
}
