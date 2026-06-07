import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { isArrears } from "@/lib/payment-health";
import { planHealthFrom, PAYABLE_PLAN_STATUSES } from "@/lib/server/arrears";

// GET /api/admin/customers?q=
export async function GET(req: NextRequest) {
  const gate = await requireAdmin("customers");
  if ("response" in gate) return gate.response;

  const q = req.nextUrl.searchParams.get("q")?.trim();
  const where: Prisma.CustomerWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const customers = await prisma.customer.findMany({
    where,
    include: {
      wallet: true,
      _count: { select: { orders: true } },
      plans: { where: { status: { in: [...PAYABLE_PLAN_STATUSES] } }, include: { payments: true, order: { select: { reference: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const shaped = customers.map((c) => {
    let worst: "overdue" | "missed" | null = null;
    for (const plan of c.plans) {
      const h = planHealthFrom(plan, plan.payments);
      if (!isArrears(h.status)) continue;
      if (h.status === "overdue") { worst = "overdue"; break; }
      worst = "missed";
    }
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      verified: c.phoneVerified,
      blocked: c.blocked,
      joined: c.createdAt,
      orderCount: c._count.orders,
      walletBalance: c.wallet?.totalBalance ?? 0,
      plans: c.plans.map((p) => ({ type: p.type, reference: p.order?.reference ?? null })),
      arrears: worst,
    };
  });

  return NextResponse.json({ customers: shaped });
}
