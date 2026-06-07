/* ------------------------------------------------------------------ *
 * Arrears — derive plan health server-side from the plan_payments ledger *
 * (payment-flow §13). Shared by /api/me/plans, admin customers, admin    *
 * arrears, and the daily recompute job.                                  *
 * ------------------------------------------------------------------ */

import type { Plan, PlanPayment } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { paymentHealth, isArrears, type PaymentHealth } from "@/lib/payment-health";

/** Statuses that are still on a live payment schedule (can fall into arrears). */
export const PAYABLE_PLAN_STATUSES = ["active", "delivered", "processing"] as const;

export function planHealthFrom(plan: Plan, payments: Pick<PlanPayment, "amount">[]): PaymentHealth {
  const amountPaid = payments.reduce((s, p) => s + p.amount, 0);
  return paymentHealth({
    price: plan.productPrice,
    amountPaid,
    perPayment: plan.perPayment,
    frequency: plan.frequency,
    startDate: plan.startDate.toISOString(),
  });
}

export type ArrearsRow = {
  plan: Plan & { payments: PlanPayment[]; product: { name: string } | null; order: { reference: string } | null };
  customer: { id: string; name: string; email: string; phone: string };
  health: PaymentHealth;
};

/** Every plan currently missed or overdue, overdue first then by amount owed. */
export async function plansInArrears(): Promise<ArrearsRow[]> {
  const plans = await prisma.plan.findMany({
    where: { status: { in: [...PAYABLE_PLAN_STATUSES] } },
    include: {
      payments: true,
      product: { select: { name: true } },
      order: { select: { reference: true } },
      customer: { select: { id: true, name: true, email: true, phone: true } },
    },
  });

  return plans
    .map((plan) => ({ plan, customer: plan.customer, health: planHealthFrom(plan, plan.payments) }))
    .filter((r) => isArrears(r.health.status))
    .sort((a, b) => {
      if (a.health.status !== b.health.status) return a.health.status === "overdue" ? -1 : 1;
      return b.health.arrears - a.health.arrears;
    });
}
