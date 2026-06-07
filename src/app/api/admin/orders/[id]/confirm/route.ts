import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, jsonError } from "@/lib/auth/guards";

type Params = { params: Promise<{ id: string }> };

// POST /api/admin/orders/:id/confirm — confirm an OUTRIGHT order's manual payment.
// Decrements stock atomically (the only place store stock changes). Idempotent.
export async function POST(_req: NextRequest, { params }: Params) {
  const gate = await requireAdmin("orders");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) return jsonError(404, "Order not found.");
  if (order.paymentPlan !== "outright") return jsonError(400, "Plan orders are confirmed per period.");

  // Idempotent: already moved on.
  if (["confirmed", "processing", "shipped", "delivered"].includes(order.status)) {
    return NextResponse.json({ order });
  }
  if (order.status === "cancelled") return jsonError(409, "This order was cancelled.");

  try {
    const updated = await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        if (!item.productId) continue;
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || product.stockQuantity < item.qty) {
          throw new Error(`Insufficient stock for "${item.name}".`);
        }
        await tx.product.update({ where: { id: product.id }, data: { stockQuantity: { decrement: item.qty } } });
      }
      return tx.order.update({ where: { id }, data: { status: "processing" } });
    });
    return NextResponse.json({ order: updated });
  } catch (e) {
    return jsonError(409, e instanceof Error ? e.message : "Could not confirm the order.");
  }
}
