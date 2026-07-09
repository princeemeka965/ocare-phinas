import { NextResponse } from "next/server";

import { supabase, unwrap } from "@/lib/supabase";
import { requireCustomer } from "@/lib/auth/guards";
import { PAYABLE_PLAN_STATUSES } from "@/lib/server/arrears";
import { ONGOING_PLAN_STATUSES } from "@/lib/pay-small-small";
import { committedAmount, solarAwaitingInstallDeposits } from "@/lib/server/wallet-breakdown";
import type { Plan, Wallet } from "@/lib/db/types";

// GET /api/me/wallet — balances + allocations split by plan type (derived).
export async function GET() {
  const gate = await requireCustomer();
  if ("response" in gate) return gate.response;

  const [walletRes, plansRes, openPlansRes, solarDeposits] = await Promise.all([
    supabase.from("Wallet").select("*").eq("customerId", gate.customer.id).maybeSingle<Wallet>(),
    supabase
      .from("Plan")
      .select("type,amountAllocated")
      .eq("customerId", gate.customer.id)
      .in("status", [...PAYABLE_PLAN_STATUSES]),
    supabase
      .from("Plan")
      .select("type,status,productPrice,deliveryFee,amountAllocated")
      .eq("customerId", gate.customer.id)
      .in("status", [...ONGOING_PLAN_STATUSES, "awaiting_installation"]),
    solarAwaitingInstallDeposits(gate.customer.id),
  ]);
  const wallet = walletRes.data;
  const plans = unwrap(plansRes) as { type: string; amountAllocated: number }[];
  const openPlans = unwrap(openPlansRes) as Pick<Plan, "type" | "status" | "productPrice" | "deliveryFee" | "amountAllocated">[];

  const soloAllocations = plans.filter((p) => p.type === "solo").reduce((s, p) => s + p.amountAllocated, 0);
  const groupAllocations = plans.filter((p) => p.type === "group").reduce((s, p) => s + p.amountAllocated, 0);

  // Available balance — uncommitted wallet cash. With no top-up/overpayment
  // feature, this is normally ₦0 (see wallet-breakdown.ts): every naira is
  // either still committed to an open plan or already spent on delivered
  // goods. A nonzero result flags the wallet drifting from the live plans.
  const totalBalance = wallet?.totalBalance ?? 0;
  const spentOnProducts = wallet?.spentOnProducts ?? 0;
  const committedTotal = openPlans.reduce((s, p) => s + committedAmount(p), 0) + solarDeposits;
  const available = totalBalance - spentOnProducts - committedTotal;

  return NextResponse.json({
    wallet: {
      total: totalBalance,
      available,
      spentOnProducts,
      soloAllocations,
      groupAllocations,
    },
  });
}
