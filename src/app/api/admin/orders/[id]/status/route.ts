import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdmin, jsonError } from "@/lib/auth/guards";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({ status: z.enum(["processing", "shipped", "delivered", "cancelled"]) });

// PATCH /api/admin/orders/:id/status — fulfilment status, only after the order
// has been confirmed (outright) or reached its threshold (plan → processing).
export async function PATCH(req: NextRequest, { params }: Params) {
  const gate = await requireAdmin("orders");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Invalid status.");

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return jsonError(404, "Order not found.");
  if (["pending_payment", "payment_submitted", "in_plan"].includes(order.status)) {
    return jsonError(409, "Confirm the payment / reach the plan threshold before updating fulfilment.");
  }

  const updated = await prisma.order.update({ where: { id }, data: { status: parsed.data.status } });
  return NextResponse.json({ order: updated });
}
