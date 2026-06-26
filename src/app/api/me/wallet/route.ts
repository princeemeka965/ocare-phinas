import { NextResponse } from "next/server";

import { supabase, unwrap } from "@/lib/supabase";
import { requireCustomer } from "@/lib/auth/guards";
import { PAYABLE_PLAN_STATUSES } from "@/lib/server/arrears";
import type { Wallet } from "@/lib/db/types";

// GET /api/me/wallet — balances + allocations split by plan type (derived).
export async function GET() {
  const gate = await requireCustomer();
  if ("response" in gate) return gate.response;

  const [walletRes, plansRes] = await Promise.all([
    supabase.from("Wallet").select("*").eq("customerId", gate.customer.id).maybeSingle<Wallet>(),
    supabase
      .from("Plan")
      .select("type,amountAllocated")
      .eq("customerId", gate.customer.id)
      .in("status", [...PAYABLE_PLAN_STATUSES]),
  ]);
  const wallet = walletRes.data;
  const plans = unwrap(plansRes) as { type: string; amountAllocated: number }[];

  const soloAllocations = plans.filter((p) => p.type === "solo").reduce((s, p) => s + p.amountAllocated, 0);
  const groupAllocations = plans.filter((p) => p.type === "group").reduce((s, p) => s + p.amountAllocated, 0);

  return NextResponse.json({
    wallet: {
      total: wallet?.totalBalance ?? 0,
      available: wallet?.availableBalance ?? 0,
      spentOnProducts: wallet?.spentOnProducts ?? 0,
      soloAllocations,
      groupAllocations,
    },
  });
}
