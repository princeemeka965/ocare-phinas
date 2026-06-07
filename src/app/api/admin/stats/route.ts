import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { plansInArrears } from "@/lib/server/arrears";
import { LOW_STOCK_THRESHOLD } from "@/lib/slug";

// GET /api/admin/stats — dashboard figures.
export async function GET() {
  const gate = await requireAdmin("dashboard");
  if ("response" in gate) return gate.response;

  const [awaitingConfirmation, openGroups, lowStock, recentOrders, arrears] = await Promise.all([
    prisma.order.count({ where: { status: "payment_submitted" } }),
    prisma.group.count({ where: { status: "open" } }),
    prisma.product.count({ where: { stockQuantity: { lt: LOW_STOCK_THRESHOLD } } }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true } } },
    }),
    plansInArrears(),
  ]);

  const overdue = arrears.filter((r) => r.health.status === "overdue");
  const missed = arrears.filter((r) => r.health.status === "missed");

  return NextResponse.json({
    awaitingConfirmation,
    openGroups,
    lowStock,
    overdue: { count: overdue.length, total: overdue.reduce((s, r) => s + r.health.arrears, 0) },
    missed: { count: missed.length, total: missed.reduce((s, r) => s + r.health.arrears, 0) },
    recentOrders,
  });
}
