/* ------------------------------------------------------------------ *
 * Wallet balance breakdown — reconciles Wallet.totalBalance against     *
 * live Plan rows so "Available balance" reflects real uncommitted cash, *
 * rather than a dead, always-zero column. It's normally 0, but two      *
 * things legitimately free money into it: a customer cancelling a plan  *
 * pre-delivery (cancelPlanForCredit, src/lib/server/lifecycle.ts — the   *
 * money stays in Wallet.totalBalance, the plan just stops counting as   *
 * committed) and a manual admin override (PlanActions — status/         *
 * amountAllocated edits skip ledger sync) leaving the wallet out of      *
 * step with the plans backing it.                                       *
 * ------------------------------------------------------------------ */

import { supabase } from "@/lib/supabase";
import { ONGOING_PLAN_STATUSES } from "@/lib/pay-small-small";
import type { Plan, Wallet } from "@/lib/db/types";

type CommittedPlan = Pick<Plan, "type" | "status" | "productPrice" | "deliveryFee" | "amountAllocated">;

/**
 * How much of an open (not completed) plan's `amountAllocated` is still
 * "committed" — paid in but not yet converted into goods — as opposed to
 * already reflected in Wallet.spentOnProducts. Mirrors the crediting rules
 * in lifecycle.ts (confirmPlanPeriod) and solar-lifecycle.ts
 * (confirmSolarPeriod / completeSolarInstallation): a solar plan is fully
 * spent the moment it's installed (any status past "awaiting_installation"),
 * since repayments there are a loan payoff for equipment already handed
 * over; a solo/group plan is only partially spent once "delivered" (the
 * goods-trigger portion — the delivery fee installments after that are
 * still committed until the plan completes).
 */
export function committedAmount(plan: CommittedPlan): number {
  if (plan.type === "solar") {
    return plan.status === "awaiting_installation" ? plan.amountAllocated : 0;
  }
  const goodsTrigger = Math.round(plan.productPrice * (plan.type === "solo" ? 0.5 : 1));
  const spentSoFar = plan.status === "delivered" ? goodsTrigger : 0;
  return plan.amountAllocated - spentSoFar;
}

type PackageEmbed = { initialDeposit: number } | { initialDeposit: number }[] | null;
type ApplicationEmbed = { package: PackageEmbed } | { package: PackageEmbed }[] | null;

function unembed<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

/**
 * Sum of initial deposits for solar plans still awaiting installation
 * (scoped to one customer if given, otherwise every customer). That money
 * is already in Wallet.totalBalance (booked in confirmSolarDeposit) but
 * isn't part of `amountAllocated` (the deposit predates the repayment
 * schedule) and isn't yet in spentOnProducts (nothing's installed yet), so
 * it has to be added to "committed" separately.
 */
export async function solarAwaitingInstallDeposits(customerId?: string): Promise<number> {
  let query = supabase
    .from("Plan")
    .select("solarApplication:SolarApplication(package:SolarPackage(initialDeposit))")
    .eq("type", "solar")
    .eq("status", "awaiting_installation");
  if (customerId) query = query.eq("customerId", customerId);
  const { data } = await query;
  const rows = (data ?? []) as { solarApplication: ApplicationEmbed }[];
  return rows.reduce((sum, row) => {
    const application = unembed(row.solarApplication);
    const pkg = unembed(application?.package ?? null);
    return sum + (pkg?.initialDeposit ?? 0);
  }, 0);
}

/**
 * Uncommitted wallet cash a customer can put toward a new plan: everything
 * paid in, minus what's already spent on delivered goods, minus what's still
 * committed to their other open plans. Single source of truth for "available
 * balance" — used both to display it (GET /api/me/wallet) and to spend it
 * (auto-applied as a lump payment when a new Solo/Group plan starts).
 */
export async function availableWalletBalance(customerId: string): Promise<number> {
  const [walletRes, openPlansRes, solarDeposits] = await Promise.all([
    supabase.from("Wallet").select("*").eq("customerId", customerId).maybeSingle<Wallet>(),
    supabase
      .from("Plan")
      .select("type,status,productPrice,deliveryFee,amountAllocated")
      .eq("customerId", customerId)
      .in("status", [...ONGOING_PLAN_STATUSES, "awaiting_installation"]),
    solarAwaitingInstallDeposits(customerId),
  ]);
  const wallet = walletRes.data;
  const openPlans = (openPlansRes.data ?? []) as CommittedPlan[];

  const totalBalance = wallet?.totalBalance ?? 0;
  const spentOnProducts = wallet?.spentOnProducts ?? 0;
  const committedTotal = openPlans.reduce((s, p) => s + committedAmount(p), 0) + solarDeposits;
  return totalBalance - spentOnProducts - committedTotal;
}
