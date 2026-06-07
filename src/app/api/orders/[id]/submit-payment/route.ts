import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCustomer, jsonError } from "@/lib/auth/guards";

type Params = { params: Promise<{ id: string }> };

// POST /api/orders/:id/submit-payment — customer marks an outright order as paid
// (after the manual transfer + WhatsApp screenshot). Admin confirms it later.
export async function POST(_req: NextRequest, { params }: Params) {
  const gate = await requireCustomer();
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.customerId !== gate.customer.id) return jsonError(404, "Order not found.");
  if (order.paymentPlan !== "outright") return jsonError(400, "Plan payments are confirmed per period by staff.");
  if (order.status !== "pending_payment") return jsonError(409, "This order is no longer awaiting your payment.");

  const updated = await prisma.order.update({ where: { id }, data: { status: "payment_submitted" } });
  return NextResponse.json({ order: updated });
}
