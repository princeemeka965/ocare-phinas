import { NextRequest, NextResponse } from "next/server";

import { supabase, unwrap } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth/guards";
import { isArrears } from "@/lib/payment-health";
import { planHealthFrom, PAYABLE_PLAN_STATUSES } from "@/lib/server/arrears";
import { ilikePattern } from "@/lib/server/product-query";
import type { Customer, Plan, PlanPayment, Wallet } from "@/lib/db/types";

type CustomerRow = Customer & {
  wallet: Wallet | null;
  orders: { count: number }[];
  plans: (Plan & { payments: PlanPayment[]; order: { reference: string } | { reference: string }[] | null })[];
};

// GET /api/admin/customers?q=
export async function GET(req: NextRequest) {
  const gate = await requireAdmin("customers");
  if ("response" in gate) return gate.response;

  const q = req.nextUrl.searchParams.get("q")?.trim();
  let query = supabase
    .from("Customer")
    .select(
      "*, wallet:Wallet(*), orders:Order(count), plans:Plan(*, payments:PlanPayment(*), order:Order(reference))",
    )
    .order("createdAt", { ascending: false });
  if (q) {
    const p = ilikePattern(q);
    query = query.or(`name.ilike."${p}",email.ilike."${p}",phone.ilike."${p}"`);
  }

  const customers = unwrap(await query) as CustomerRow[];

  const shaped = customers.map((c) => {
    // Only live (payable) plans can be in arrears.
    const payablePlans = c.plans.filter((p) => (PAYABLE_PLAN_STATUSES as readonly string[]).includes(p.status));
    let worst: "overdue" | "missed" | null = null;
    for (const plan of payablePlans) {
      const h = planHealthFrom(plan, plan.payments);
      if (!isArrears(h.status)) continue;
      if (h.status === "overdue") { worst = "overdue"; break; }
      worst = "missed";
    }
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      verified: c.phoneVerified,
      blocked: c.blocked,
      joined: c.createdAt,
      orderCount: c.orders[0]?.count ?? 0,
      walletBalance: c.wallet?.totalBalance ?? 0,
      plans: payablePlans.map((p) => {
        const order = Array.isArray(p.order) ? (p.order[0] ?? null) : p.order;
        return { type: p.type, reference: order?.reference ?? null };
      }),
      arrears: worst,
    };
  });

  return NextResponse.json({ customers: shaped });
}
