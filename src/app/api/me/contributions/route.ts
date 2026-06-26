import { NextResponse } from "next/server";

import { supabase, unwrap } from "@/lib/supabase";
import { requireCustomer } from "@/lib/auth/guards";
import type { PlanPayment } from "@/lib/db/types";

// GET /api/me/contributions — the confirmed plan-payment ledger (My Plan).
export async function GET() {
  const gate = await requireCustomer();
  if ("response" in gate) return gate.response;

  const payments = unwrap(
    await supabase
      .from("PlanPayment")
      .select("*, plan:Plan!inner(customerId, order:Order(reference))")
      .eq("plan.customerId", gate.customer.id)
      .order("confirmedAt", { ascending: false })
      .limit(100),
  ) as (PlanPayment & { plan: { order: { reference: string } | { reference: string }[] | null } })[];

  return NextResponse.json({
    contributions: payments.map((p) => {
      const order = Array.isArray(p.plan.order) ? (p.plan.order[0] ?? null) : p.plan.order;
      return {
        id: p.id,
        date: p.confirmedAt,
        amount: p.amount,
        plan: order?.reference ?? null,
        periodIndex: p.periodIndex,
        status: "confirmed" as const,
      };
    }),
  });
}
