import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, jsonError } from "@/lib/auth/guards";

type Params = { params: Promise<{ id: string }> };

// POST /api/admin/orders/:id/reject — reject an outright order's payment → cancelled.
export async function POST(_req: NextRequest, { params }: Params) {
  const gate = await requireAdmin("orders");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return jsonError(404, "Order not found.");
  if (!["pending_payment", "payment_submitted"].includes(order.status)) {
    return jsonError(409, "Only an order awaiting confirmation can be rejected.");
  }

  const updated = await prisma.order.update({ where: { id }, data: { status: "cancelled" } });
  return NextResponse.json({ order: updated });
}
