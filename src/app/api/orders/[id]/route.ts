import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCustomer, jsonError } from "@/lib/auth/guards";

type Params = { params: Promise<{ id: string }> };

// GET /api/orders/:id — the customer's own order.
export async function GET(_req: NextRequest, { params }: Params) {
  const gate = await requireCustomer();
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const order = await prisma.order.findUnique({ where: { id }, include: { items: true, plan: true } });
  if (!order || order.customerId !== gate.customer.id) return jsonError(404, "Order not found.");
  return NextResponse.json({ order });
}
