/* ------------------------------------------------------------------ *
 * Order & plan lifecycle — server-side business rules (payment-flow §10/§14) *
 * ------------------------------------------------------------------ *
 * Manual payments: stock, plan progress and order status only ever      *
 * change here, when an admin confirms. All money mutations run in a      *
 * transaction and are idempotent.                                       *
 * ------------------------------------------------------------------ */

import { prisma } from "@/lib/prisma";
import { planPeriods } from "@/lib/payment-health";

const NON_FINAL_PLAN = ["active", "processing", "delivered", "awaiting_substitution"] as const;

/** A unique order reference, e.g. OCP-2026-04821. */
export async function nextOrderReference(): Promise<string> {
  const year = new Date().getFullYear();
  for (let i = 0; i < 10; i++) {
    const reference = `OCP-${year}-${Math.floor(10000 + Math.random() * 90000)}`;
    if (!(await prisma.order.findUnique({ where: { reference } }))) return reference;
  }
  return `OCP-${year}-${Date.now()}`;
}

/** A unique group reference, e.g. G-017. */
export async function nextGroupReference(): Promise<string> {
  const count = await prisma.group.count();
  for (let n = count + 1; ; n++) {
    const reference = `G-${String(n).padStart(3, "0")}`;
    if (!(await prisma.group.findUnique({ where: { reference } }))) return reference;
  }
}

/** Whether the customer already has a non-completed plan of this saving type (§1). */
export async function hasActivePlanOfType(customerId: string, type: "solo" | "group"): Promise<boolean> {
  const n = await prisma.plan.count({ where: { customerId, type, status: { in: [...NON_FINAL_PLAN] } } });
  return n > 0;
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
 */
export async function confirmPlanPeriod(orderId: string, periodIndex: number, adminId: string): Promise<ConfirmResult> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { plan: true } });
  if (!order || !order.plan) return { ok: false, status: 404, error: "Plan order not found." };
  const plan = order.plan;

  const payments = await prisma.planPayment.findMany({ where: { planId: plan.id } });
  const periods = planPeriods({
    price: plan.productPrice,
    perPayment: plan.perPayment,
    frequency: plan.frequency,
    startDate: plan.startDate.toISOString(),
    paidIndices: payments.map((p) => p.periodIndex),
  });
  const period = periods.find((p) => p.index === periodIndex);
  if (!period) return { ok: false, status: 400, error: "Invalid period." };
  if (period.status === "paid") return { ok: false, status: 409, error: "That period is already confirmed." };
  if (period.status === "upcoming") return { ok: false, status: 400, error: "No paying ahead — that period is not due yet." };

  const result = await prisma.$transaction(async (tx) => {
    await tx.planPayment.create({
      data: { planId: plan.id, periodIndex, amount: period.amount, dueDate: new Date(period.dueDate), confirmedById: adminId },
    });

    const agg = await tx.planPayment.aggregate({ where: { planId: plan.id }, _sum: { amount: true } });
    const amountAllocated = agg._sum.amount ?? 0;

    const wallet = await tx.wallet.findUnique({ where: { customerId: plan.customerId } });
    if (wallet) {
      await tx.transaction.createMany({
        data: [
          { walletId: wallet.id, type: "deposit", amount: period.amount, planId: plan.id, approved: true },
          { walletId: wallet.id, type: "allocation", amount: period.amount, planId: plan.id, approved: true },
        ],
      });
      await tx.wallet.update({ where: { id: wallet.id }, data: { totalBalance: { increment: period.amount } } });
    }

    let planStatus: string = plan.status;
    let orderStatus: string = order.status;
    let awaitingSubstitution = false;

    const threshold = plan.type === "solo" ? 0.5 : 1;
    const reached = amountAllocated >= Math.round(plan.productPrice * threshold);

    if (order.status === "in_plan" && reached) {
      const product = plan.productId ? await tx.product.findUnique({ where: { id: plan.productId } }) : null;
      if (product && product.stockQuantity <= 0) {
        planStatus = "awaiting_substitution";
        awaitingSubstitution = true;
        await tx.notification.create({
          data: {
            customerId: plan.customerId, channel: "in_app", type: "out_of_stock_substitution", planId: plan.id,
            body: `The ${product.name} you're saving toward is out of stock. Open the app to pick an alternate product — your money is safe.`,
          },
        });
      } else {
        orderStatus = "processing";
        if (product) await tx.product.update({ where: { id: product.id }, data: { stockQuantity: { decrement: 1 } } });
      }
    }

    if (!awaitingSubstitution) {
      if (amountAllocated >= plan.productPrice) {
        planStatus = "completed";
        if (plan.type === "group" && plan.groupId) {
          await tx.groupMembership.deleteMany({ where: { groupId: plan.groupId, customerId: plan.customerId } });
          await tx.group.update({ where: { id: plan.groupId }, data: { slotsFilled: { decrement: plan.slots } } });
        }
      } else if (plan.type === "solo" && amountAllocated >= Math.round(plan.productPrice * 0.5)) {
        planStatus = "delivered";
      }
    }

    await tx.plan.update({ where: { id: plan.id }, data: { amountAllocated, status: planStatus as never } });
    if (orderStatus !== order.status) {
      await tx.order.update({ where: { id: order.id }, data: { status: orderStatus as never } });
    }

    return { amountAllocated, planStatus, orderStatus, awaitingSubstitution };
  });

  return { ok: true, ...result, orderStatus: result.orderStatus };
}
