/* ------------------------------------------------------------------ *
 * Order & plan lifecycle — server-side business rules (payment-flow §10/§14) *
 * ------------------------------------------------------------------ *
 * Manual payments: stock, plan progress and order status only ever      *
 * change here, when an admin confirms. Idempotency is enforced by the    *
 * unique (planId, periodIndex) constraint on PlanPayment; the atomic     *
 * counter RPCs (inc_*) keep balance/stock/slot updates race-safe.        *
 * ------------------------------------------------------------------ */

import { supabase, unwrap } from "@/lib/supabase";
import { planPeriods } from "@/lib/payment-health";
import { ONGOING_PLAN_STATUSES } from "@/lib/pay-small-small";
import type { Order, Plan, PlanPayment, Product, Wallet } from "@/lib/db/types";

const NON_FINAL_PLAN = ONGOING_PLAN_STATUSES;

/** A unique order reference, e.g. OCP-2026-04821. */
export async function nextOrderReference(): Promise<string> {
  const year = new Date().getFullYear();
  for (let i = 0; i < 10; i++) {
    const reference = `OCP-${year}-${Math.floor(10000 + Math.random() * 90000)}`;
    const { data } = await supabase.from("Order").select("id").eq("reference", reference).maybeSingle();
    if (!data) return reference;
  }
  return `OCP-${year}-${Date.now()}`;
}

/** A unique group reference, e.g. G-017. */
export async function nextGroupReference(): Promise<string> {
  const { count } = await supabase.from("Group").select("*", { count: "exact", head: true });
  for (let n = (count ?? 0) + 1; ; n++) {
    const reference = `G-${String(n).padStart(3, "0")}`;
    const { data } = await supabase.from("Group").select("id").eq("reference", reference).maybeSingle();
    if (!data) return reference;
  }
}

/** Whether the customer already has a non-completed plan of this saving type (§1). */
export async function hasActivePlanOfType(customerId: string, type: "solo" | "group"): Promise<boolean> {
  const { count } = await supabase
    .from("Plan")
    .select("*", { count: "exact", head: true })
    .eq("customerId", customerId)
    .eq("type", type)
    .in("status", [...NON_FINAL_PLAN]);
  return (count ?? 0) > 0;
}

export type ConfirmResult =
  | { ok: true; amountAllocated: number; planStatus: string; orderStatus: string | null; awaitingSubstitution: boolean }
  | { ok: false; status: number; error: string };

/**
 * Confirm one manual payment period for a Solo/Group plan. Idempotent on
 * (plan, period). Recomputes allocation, advances order to `processing` at the
 * threshold (solo 50% / group 100%) decrementing stock once, completes the plan
 * at 100% (group: also removes membership + frees the slot), and pauses to
 * `awaiting_substitution` if the product sold out at the trigger (§7).
 *
 * `allowAhead` skips the "not due yet" guard — used by recordLumpPayment,
 * where a customer paying several periods at once (e.g. ₦130k upfront) is
 * expected to reach periods that haven't come due on the schedule yet.
 */
export async function confirmPlanPeriod(
  orderId: string,
  periodIndex: number,
  adminId: string | null,
  opts?: { allowAhead?: boolean },
): Promise<ConfirmResult> {
  const { data: order } = await supabase
    .from("Order")
    .select("*, plan:Plan(*)")
    .eq("id", orderId)
    .maybeSingle<Order & { plan: Plan | null }>();
  if (!order || !order.plan) return { ok: false, status: 404, error: "Plan order not found." };
  const plan = order.plan;

  // The schedule collects the product price plus any door-delivery fee; the
  // fulfilment triggers below still key off the product price (the goods value).
  const scheduleTotal = plan.productPrice + plan.deliveryFee;
  const existing = unwrap(
    await supabase.from("PlanPayment").select("*").eq("planId", plan.id),
  ) as PlanPayment[];
  const periods = planPeriods({
    price: scheduleTotal,
    perPayment: plan.perPayment,
    frequency: plan.frequency,
    startDate: new Date(plan.startDate).toISOString(),
    paidIndices: existing.map((p) => p.periodIndex),
  });
  const period = periods.find((p) => p.index === periodIndex);
  if (!period) return { ok: false, status: 400, error: "Invalid period." };
  if (period.status === "paid") return { ok: false, status: 409, error: "That period is already confirmed." };
  if (period.status === "upcoming" && !opts?.allowAhead) {
    return { ok: false, status: 400, error: "No paying ahead — that period is not due yet." };
  }

  // Record the period. The unique (planId, periodIndex) constraint makes this
  // idempotent — a concurrent duplicate confirm fails here (code 23505).
  const inserted = await supabase.from("PlanPayment").insert({
    planId: plan.id,
    periodIndex,
    amount: period.amount,
    dueDate: new Date(period.dueDate).toISOString(),
    confirmedById: adminId,
  });
  if (inserted.error) {
    if (inserted.error.code === "23505") return { ok: false, status: 409, error: "That period is already confirmed." };
    return { ok: false, status: 500, error: inserted.error.message };
  }

  const amountAllocated = existing.reduce((s, p) => s + p.amount, 0) + period.amount;

  // Ledger: every confirmed period deposits and allocates the same amount.
  const { data: wallet } = await supabase
    .from("Wallet")
    .select("*")
    .eq("customerId", plan.customerId)
    .maybeSingle<Wallet>();
  if (wallet) {
    await supabase.from("Transaction").insert([
      { walletId: wallet.id, type: "deposit", amount: period.amount, planId: plan.id, approved: true },
      { walletId: wallet.id, type: "allocation", amount: period.amount, planId: plan.id, approved: true },
    ]);
    await supabase.rpc("inc_wallet_total", { w_id: wallet.id, delta: period.amount });
  }

  let planStatus: string = plan.status;
  let orderStatus: string = order.status;
  let awaitingSubstitution = false;

  // Goods are delivered at the fulfilment trigger — solo 50%, group 100% — of
  // the product price (the delivery fee is finished off afterwards as balance).
  const goodsTrigger = Math.round(plan.productPrice * (plan.type === "solo" ? 0.5 : 1));
  const reached = amountAllocated >= goodsTrigger;

  if (order.status === "in_plan" && reached) {
    const product = plan.productId
      ? ((await supabase.from("Product").select("*").eq("id", plan.productId).maybeSingle<Product>()).data ?? null)
      : null;
    if (product && product.stockQuantity <= 0) {
      planStatus = "awaiting_substitution";
      awaitingSubstitution = true;
      await supabase.from("Notification").insert({
        customerId: plan.customerId,
        channel: "in_app",
        type: "out_of_stock_substitution",
        planId: plan.id,
        body: `The ${product.name} you're saving toward is out of stock. Open the app to pick an alternate product — your money is safe.`,
      });
    } else {
      orderStatus = "processing";
      if (product) await supabase.rpc("inc_product_stock", { p_id: product.id, delta: -1 });
      // Goods just changed hands — that portion of the wallet balance is now
      // spent (converted into a product), not sitting toward a future delivery.
      if (wallet) await supabase.rpc("inc_wallet_spent", { w_id: wallet.id, delta: goodsTrigger });
    }
  }

  if (!awaitingSubstitution) {
    if (amountAllocated >= scheduleTotal) {
      // Fully paid (product + delivery) — plan completes.
      planStatus = "completed";
      if (plan.type === "group" && plan.groupId) {
        await supabase.from("GroupMembership").delete().eq("groupId", plan.groupId).eq("customerId", plan.customerId);
        await supabase.rpc("inc_group_slots", { g_id: plan.groupId, delta: -plan.slots });
      }
      // The delivery fee just paid off is also spent — nothing about this
      // plan remains uncommitted or in progress.
      if (wallet) await supabase.rpc("inc_wallet_spent", { w_id: wallet.id, delta: scheduleTotal - goodsTrigger });
    } else if (amountAllocated >= goodsTrigger) {
      // Goods delivered; the remaining delivery fee is paid off as balance.
      planStatus = "delivered";
    }
  }

  await supabase.from("Plan").update({ amountAllocated, status: planStatus }).eq("id", plan.id);
  if (orderStatus !== order.status) {
    await supabase.from("Order").update({ status: orderStatus }).eq("id", order.id);
  }

  return { ok: true, amountAllocated, planStatus, orderStatus, awaitingSubstitution };
}

export type LumpPaymentResult =
  | (ConfirmResult & { periodsConfirmed: number; leftover: number })
  | { ok: false; status: number; error: string };

/**
 * Record a lump sum against a Solo/Group plan — e.g. an admin editing
 * "amount paid" from ₦30,000 to ₦90,000 after a further ₦60,000 came in.
 * Fills whole periods in schedule order via confirmPlanPeriod (so the wallet
 * credit, goods trigger and completion checks all run exactly as they would
 * for a normal confirm — this is not a parallel code path), allowing ahead
 * since a lump sum routinely covers periods that aren't due yet. Any amount
 * left over once every affordable whole period is filled (the payment didn't
 * land on a period boundary) is still credited to the wallet as uncommitted
 * balance — real money the customer paid, not lost — ready to apply once
 * it's enough to cover the next period.
 *
 * `adminId` is `null` when this is a customer's own available wallet balance
 * auto-applying to a plan they just started (no admin involved).
 */
export async function recordLumpPayment(orderId: string, amount: number, adminId: string | null): Promise<LumpPaymentResult> {
  if (amount <= 0) return { ok: false, status: 400, error: "Amount must be greater than zero." };

  const { data: order } = await supabase
    .from("Order")
    .select("*, plan:Plan(*)")
    .eq("id", orderId)
    .maybeSingle<Order & { plan: Plan | null }>();
  if (!order || !order.plan) return { ok: false, status: 404, error: "Plan order not found." };
  const plan = order.plan;

  const scheduleTotal = plan.productPrice + plan.deliveryFee;
  const existing = unwrap(
    await supabase.from("PlanPayment").select("*").eq("planId", plan.id),
  ) as PlanPayment[];
  const unpaid = planPeriods({
    price: scheduleTotal,
    perPayment: plan.perPayment,
    frequency: plan.frequency,
    startDate: new Date(plan.startDate).toISOString(),
    paidIndices: existing.map((p) => p.periodIndex),
  })
    .filter((p) => p.status !== "paid")
    .sort((a, b) => a.index - b.index);

  let remaining = amount;
  let periodsConfirmed = 0;
  let last: ConfirmResult | null = null;

  for (const period of unpaid) {
    if (remaining < period.amount) break;
    const result = await confirmPlanPeriod(orderId, period.index, adminId, { allowAhead: true });
    if (!result.ok) return result;
    remaining -= period.amount;
    periodsConfirmed++;
    last = result;
  }

  if (remaining > 0) {
    const { data: wallet } = await supabase
      .from("Wallet")
      .select("*")
      .eq("customerId", plan.customerId)
      .maybeSingle<Wallet>();
    if (wallet) {
      await supabase.from("Transaction").insert({
        walletId: wallet.id,
        type: "deposit",
        amount: remaining,
        planId: plan.id,
        approved: true,
      });
      await supabase.rpc("inc_wallet_total", { w_id: wallet.id, delta: remaining });
    }
  }

  return {
    ok: true,
    amountAllocated: last?.amountAllocated ?? plan.amountAllocated,
    planStatus: last?.planStatus ?? plan.status,
    orderStatus: last?.orderStatus ?? order.status,
    awaitingSubstitution: last?.awaitingSubstitution ?? false,
    periodsConfirmed,
    leftover: remaining,
  };
}

/**
 * Adjust Wallet.totalBalance by an arbitrary delta with no PlanPayment/period
 * changes — used for the rare manual correction (an admin lowering a
 * previously over-recorded amountAllocated, or crediting a solar deposit-stage
 * plan that has no active repayment schedule yet). No Transaction row: this
 * mirrors reversePlan's direct inc_wallet_total call rather than a normal
 * deposit, since it isn't a real payment event.
 */
export async function adjustWalletTotal(customerId: string, delta: number): Promise<void> {
  if (delta === 0) return;
  const { data: wallet } = await supabase
    .from("Wallet")
    .select("id")
    .eq("customerId", customerId)
    .maybeSingle<Pick<Wallet, "id">>();
  if (wallet) await supabase.rpc("inc_wallet_total", { w_id: wallet.id, delta });
}

/**
 * Reverse every money/stock/slot effect a Plan has accumulated, then delete
 * it. Used by the admin "delete plan" and "delete order" actions — nothing
 * else in the app ever undoes a confirmed payment.
 *
 * - Wallet: `amountAllocated` is exactly the running sum of every confirmed
 *   period's `inc_wallet_total` credit, so reversing it is a single call —
 *   no need to re-sum Transaction rows.
 * - Stock: only "delivered"/"completed" plans ever reached the goods trigger
 *   with stock available (the only branch that decremented it).
 * - Group slot: only reversed if the plan hasn't completed — a completed
 *   plan already freed its slot via this exact same call at confirm time,
 *   and freeing it again would double-credit the group.
 * - Transaction rows are kept for audit but detached (`planId` has no
 *   `ON DELETE` clause, so it must be cleared before the Plan row can go).
 *   Order.planId is likewise a bare reference with no `ON DELETE` clause —
 *   any Order still pointing at this plan is detached the same way, *before*
 *   the delete, otherwise Postgres rejects it with a foreign-key violation.
 * - Spent-on-products: mirrors whatever confirmPlanPeriod credited at the
 *   delivered/completed transitions, recomputed from the same fields (solo/
 *   group only — solar's deposit-driven spend is reversed separately in
 *   revertSolarApplicationAfterPlanDeletion, since it needs the linked
 *   SolarPackage, not just the Plan row).
 */
export async function reversePlan(plan: Plan): Promise<void> {
  if (plan.amountAllocated > 0) {
    const { data: wallet } = await supabase
      .from("Wallet")
      .select("*")
      .eq("customerId", plan.customerId)
      .maybeSingle<Wallet>();
    if (wallet) {
      await supabase.rpc("inc_wallet_total", { w_id: wallet.id, delta: -plan.amountAllocated });

      if (plan.type !== "solar" && (plan.status === "delivered" || plan.status === "completed")) {
        const goodsTrigger = Math.round(plan.productPrice * (plan.type === "solo" ? 0.5 : 1));
        const scheduleTotal = plan.productPrice + plan.deliveryFee;
        const spent = plan.status === "completed" ? scheduleTotal : goodsTrigger;
        await supabase.rpc("inc_wallet_spent", { w_id: wallet.id, delta: -spent });
      }
    }
  }

  if ((plan.status === "delivered" || plan.status === "completed") && plan.productId) {
    await supabase.rpc("inc_product_stock", { p_id: plan.productId, delta: 1 });
  }

  if (plan.type === "group" && plan.groupId && plan.status !== "completed") {
    const { data: membership } = await supabase
      .from("GroupMembership")
      .select("id,slotsHeld")
      .eq("groupId", plan.groupId)
      .eq("customerId", plan.customerId)
      .maybeSingle<{ id: string; slotsHeld: number }>();
    if (membership) {
      await supabase.from("GroupMembership").delete().eq("id", membership.id);
      await supabase.rpc("inc_group_slots", { g_id: plan.groupId, delta: -membership.slotsHeld });
    }
  }

  await supabase.from("Transaction").update({ planId: null }).eq("planId", plan.id);
  await supabase.from("Order").update({ planId: null }).eq("planId", plan.id);
  const deleted = await supabase.from("Plan").delete().eq("id", plan.id);
  if (deleted.error) throw new Error(deleted.error.message);
}

/**
 * Cancel a plan that hasn't delivered anything yet (status "active"), turning
 * its paid-in balance into reusable wallet credit — unlike reversePlan, this
 * deliberately leaves Wallet.totalBalance/spentOnProducts untouched. The money
 * was real; it just stops being "committed" to this plan. Wallet's available
 * balance is derived live from open Plan rows (wallet-breakdown.ts), so a
 * status flip to "cancelled" — a status excluded from ONGOING_PLAN_STATUSES/
 * PAYABLE_PLAN_STATUSES — is enough to free it, no ledger writes needed. The
 * Plan row is kept (not deleted) so PlanPayment history stays intact for
 * audit; the caller is responsible for marking the linked Order cancelled.
 */
export async function cancelPlanForCredit(plan: Plan): Promise<void> {
  if (plan.type === "group" && plan.groupId) {
    const { data: membership } = await supabase
      .from("GroupMembership")
      .select("id,slotsHeld")
      .eq("groupId", plan.groupId)
      .eq("customerId", plan.customerId)
      .maybeSingle<{ id: string; slotsHeld: number }>();
    if (membership) {
      await supabase.from("GroupMembership").delete().eq("id", membership.id);
      await supabase.rpc("inc_group_slots", { g_id: plan.groupId, delta: -membership.slotsHeld });
    }
  }

  const updated = await supabase.from("Plan").update({ status: "cancelled" }).eq("id", plan.id);
  if (updated.error) throw new Error(updated.error.message);
}
