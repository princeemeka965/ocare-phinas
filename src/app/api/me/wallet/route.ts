import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/auth/guards";
import { PAYABLE_PLAN_STATUSES } from "@/lib/server/arrears";

// GET /api/me/wallet — balances + allocations split by plan type (derived).
export async function GET() {
  const gate = await requireCustomer();
  if ("response" in gate) return gate.response;

  const [wallet, plans] = await Promise.all([
    prisma.wallet.findUnique({ where: { customerId: gate.customer.id } }),
    prisma.plan.findMany({
      where: { customerId: gate.customer.id, status: { in: [...PAYABLE_PLAN_STATUSES] } },
      select: { type: true, amountAllocated: true },
    }),
  ]);

  const soloAllocations = plans.filter((p) => p.type === "solo").reduce((s, p) => s + p.amountAllocated, 0);
  const groupAllocations = plans.filter((p) => p.type === "group").reduce((s, p) => s + p.amountAllocated, 0);

  return NextResponse.json({
    wallet: {
      total: wallet?.totalBalance ?? 0,
      available: wallet?.availableBalance ?? 0,
      spentOnProducts: wallet?.spentOnProducts ?? 0,
      soloAllocations,
      groupAllocations,
    },
  });
}
