import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, jsonError } from "@/lib/auth/guards";
import { planPeriods, paymentHealth } from "@/lib/payment-health";

type Params = { params: Promise<{ id: string }> };

// GET /api/admin/orders/:id — full order; for plan orders also the payment
// schedule (periods) and arrears health, derived from the kept helpers.
export async function GET(_req: NextRequest, { params }: Params) {
  const gate = await requireAdmin("orders");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: { select: { name: true, email: true, phone: true } },
      items: true,
      plan: { include: { payments: true } },
    },
  });
  if (!order) return jsonError(404, "Order not found.");

  let periods = null;
  let health = null;
  if (order.plan) {
    const p = order.plan;
    const paidIndices = p.payments.map((pp) => pp.periodIndex);
    // Schedule collects the product price plus any door-delivery fee.
    const scheduleTotal = p.productPrice + p.deliveryFee;
    periods = planPeriods({
      price: scheduleTotal, perPayment: p.perPayment, frequency: p.frequency,
      startDate: p.startDate.toISOString(), paidIndices,
    });
    const amountPaid = p.payments.reduce((s, pp) => s + pp.amount, 0);
    health = paymentHealth({
      price: scheduleTotal, amountPaid, perPayment: p.perPayment, frequency: p.frequency,
      startDate: p.startDate.toISOString(),
    });
  }

  return NextResponse.json({ order, periods, health });
}
