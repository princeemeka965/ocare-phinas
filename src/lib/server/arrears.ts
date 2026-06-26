/* ------------------------------------------------------------------ *
 * Arrears — derive plan health server-side from the plan_payments ledger *
 * (payment-flow §13). Shared by /api/me/plans, admin customers, admin    *
 * arrears, and the daily recompute job.                                  *
 * ------------------------------------------------------------------ */

import type { Plan, PlanPayment } from "@/lib/db/types";

import { supabase, unwrap } from "@/lib/supabase";
import { paymentHealth, isArrears, type PaymentHealth } from "@/lib/payment-health";

/** Statuses that are still on a live payment schedule (can fall into arrears). */
export const PAYABLE_PLAN_STATUSES = ["active", "delivered", "processing"] as const;

export function planHealthFrom(plan: Plan, payments: Pick<PlanPayment, "amount">[]): PaymentHealth {
  const amountPaid = payments.reduce((s, p) => s + p.amount, 0);
  return paymentHealth({
    // Schedule collects the product price plus any door-delivery fee.
    price: plan.productPrice + plan.deliveryFee,
    amountPaid,
    perPayment: plan.perPayment,
    frequency: plan.frequency,
    startDate: new Date(plan.startDate).toISOString(),
  });
}

export type ArrearsRow = {
  plan: Plan & { payments: PlanPayment[]; product: { name: string } | null; order: { reference: string } | null };
  customer: { id: string; name: string; email: string; phone: string };
  health: PaymentHealth;
};

/** Every plan currently missed or overdue, overdue first then by amount owed. */
export async function plansInArrears(): Promise<ArrearsRow[]> {
  const rows = unwrap(
    await supabase
      .from("Plan")
      .select(
        "*, payments:PlanPayment(*), product:Product(name), order:Order(reference), customer:Customer(id,name,email,phone)",
      )
      .in("status", [...PAYABLE_PLAN_STATUSES]),
  ) as (Plan & {
    payments: PlanPayment[];
    product: { name: string } | null;
    order: { reference: string } | { reference: string }[] | null;
    customer: { id: string; name: string; email: string; phone: string };
  })[];

  const plans = rows.map((r) => ({
    ...r,
    // A unique FK (Order.planId) is a to-one relation; normalise if it comes
    // back as a single-element array.
    order: Array.isArray(r.order) ? (r.order[0] ?? null) : r.order,
  }));

  return plans
    .map((plan) => ({ plan, customer: plan.customer, health: planHealthFrom(plan, plan.payments) }))
    .filter((r) => isArrears(r.health.status))
    .sort((a, b) => {
      if (a.health.status !== b.health.status) return a.health.status === "overdue" ? -1 : 1;
      return b.health.arrears - a.health.arrears;
    });
}
