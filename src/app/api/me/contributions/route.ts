import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/auth/guards";

// GET /api/me/contributions — the confirmed plan-payment ledger (My Plan).
export async function GET() {
  const gate = await requireCustomer();
  if ("response" in gate) return gate.response;

  const payments = await prisma.planPayment.findMany({
    where: { plan: { customerId: gate.customer.id } },
    include: { plan: { select: { order: { select: { reference: true } } } } },
    orderBy: { confirmedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    contributions: payments.map((p) => ({
      id: p.id,
      date: p.confirmedAt,
      amount: p.amount,
      plan: p.plan.order?.reference ?? null,
      periodIndex: p.periodIndex,
      status: "confirmed" as const,
    })),
  });
}
