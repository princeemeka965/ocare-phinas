import { NextResponse } from "next/server";

import { supabase, unwrap } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth/guards";
import { plansInArrears } from "@/lib/server/arrears";
import { arrearsSummary } from "@/lib/payment-health";
import { ONGOING_PLAN_STATUSES } from "@/lib/pay-small-small";
import type { Order, Plan, PlanType, Transaction, Wallet } from "@/lib/db/types";

const PLAN_TYPES: PlanType[] = ["outright", "solo", "group", "solar"];

function emptyByType(): Record<PlanType, number> {
  return { outright: 0, solo: 0, group: 0, solar: 0 };
}

function startOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

type DepositTxn = Pick<Transaction, "amount" | "createdAt"> & { plan: { type: PlanType } | { type: PlanType }[] | null };
type OngoingPlan = Pick<Plan, "type" | "productPrice" | "deliveryFee" | "amountAllocated">;
type WalletTotals = Pick<Wallet, "totalBalance" | "availableBalance" | "spentOnProducts">;

// GET /api/admin/reports — superadmin-only overview: revenue realized,
// outstanding/expected payments, and wallet & registration-fee totals.
// Gated purely by "reports", which is excluded from ASSIGNABLE_PERMISSIONS —
// so hasPermission only ever returns true for role === "super".
export async function GET() {
  const gate = await requireAdmin("reports");
  if ("response" in gate) return gate.response;

  const monthStart = startOfMonth();

  const [outrightOrdersRes, depositTxnsRes, ongoingPlansRes, arrears, walletsRes, regFeesRes] = await Promise.all([
    supabase
      .from("Order")
      .select("total,createdAt")
      .eq("paymentPlan", "outright")
      .in("status", ["processing", "shipped", "delivered"]),
    supabase.from("Transaction").select("amount,createdAt,plan:Plan(type)").eq("type", "deposit"),
    supabase
      .from("Plan")
      .select("type,productPrice,deliveryFee,amountAllocated")
      .in("status", [...ONGOING_PLAN_STATUSES, "awaiting_installation"]),
    plansInArrears(),
    supabase.from("Wallet").select("totalBalance,availableBalance,spentOnProducts"),
    supabase.from("Transaction").select("amount").eq("type", "registration_fee"),
  ]);

  const outrightOrders = unwrap(outrightOrdersRes) as Pick<Order, "total" | "createdAt">[];
  const depositTxns = unwrap(depositTxnsRes) as DepositTxn[];
  const ongoingPlans = unwrap(ongoingPlansRes) as OngoingPlan[];
  const wallets = unwrap(walletsRes) as WalletTotals[];
  const regFees = unwrap(regFeesRes) as Pick<Transaction, "amount">[];

  // Revenue realized — outright confirmed orders + every deposit transaction
  // (covers every confirmed solo/group period and the solar initial deposit).
  const revenueByType = emptyByType();
  const revenueThisMonthByType = emptyByType();

  for (const o of outrightOrders) {
    revenueByType.outright += o.total;
    if (o.createdAt >= monthStart) revenueThisMonthByType.outright += o.total;
  }
  for (const t of depositTxns) {
    const type = Array.isArray(t.plan) ? t.plan[0]?.type : t.plan?.type;
    if (!type) continue;
    revenueByType[type] += t.amount;
    if (t.createdAt >= monthStart) revenueThisMonthByType[type] += t.amount;
  }
  const revenueTotal = PLAN_TYPES.reduce((s, t) => s + revenueByType[t], 0);
  const revenueThisMonthTotal = PLAN_TYPES.reduce((s, t) => s + revenueThisMonthByType[t], 0);

  // Outstanding / expected payments — remaining balance on every ongoing plan.
  const expectedRemainingByType = emptyByType();
  for (const p of ongoingPlans) {
    const scheduleTotal = p.productPrice + p.deliveryFee;
    expectedRemainingByType[p.type] += Math.max(0, scheduleTotal - p.amountAllocated);
  }
  const expectedRemainingTotal = PLAN_TYPES.reduce((s, t) => s + expectedRemainingByType[t], 0);
  const arrearsTotals = arrearsSummary(arrears.map((r) => r.health));

  // Wallet & registration fee totals.
  const walletTotals = wallets.reduce(
    (acc, w) => ({
      totalBalance: acc.totalBalance + w.totalBalance,
      availableBalance: acc.availableBalance + w.availableBalance,
      spentOnProducts: acc.spentOnProducts + w.spentOnProducts,
    }),
    { totalBalance: 0, availableBalance: 0, spentOnProducts: 0 },
  );
  const registrationFeesTotal = regFees.reduce((s, t) => s + t.amount, 0);

  return NextResponse.json({
    revenue: {
      total: revenueTotal,
      thisMonth: revenueThisMonthTotal,
      byType: revenueByType,
      thisMonthByType: revenueThisMonthByType,
    },
    outstanding: {
      expectedRemainingTotal,
      expectedRemainingByType,
      arrears: arrearsTotals,
    },
    wallets: {
      ...walletTotals,
      registrationFeesTotal,
    },
  });
}
