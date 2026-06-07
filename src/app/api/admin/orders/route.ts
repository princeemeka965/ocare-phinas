import { NextRequest, NextResponse } from "next/server";
import type { Prisma, OrderStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";

const STATUSES = new Set<OrderStatus>([
  "pending_payment", "payment_submitted", "in_plan", "confirmed", "processing", "shipped", "delivered", "cancelled",
]);

// GET /api/admin/orders?status=&q=
export async function GET(req: NextRequest) {
  const gate = await requireAdmin("orders");
  if ("response" in gate) return gate.response;

  const sp = req.nextUrl.searchParams;
  const where: Prisma.OrderWhereInput = {};
  const status = sp.get("status");
  if (status && STATUSES.has(status as OrderStatus)) where.status = status as OrderStatus;

  const q = sp.get("q")?.trim();
  if (q) {
    where.OR = [
      { reference: { contains: q, mode: "insensitive" } },
      { customer: { name: { contains: q, mode: "insensitive" } } },
      { customer: { phone: { contains: q, mode: "insensitive" } } },
      { items: { some: { name: { contains: q, mode: "insensitive" } } } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      customer: { select: { name: true, email: true, phone: true } },
      items: true,
      plan: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ orders });
}
