import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, jsonError } from "@/lib/auth/guards";
import { planHealthFrom, PAYABLE_PLAN_STATUSES } from "@/lib/server/arrears";

type Params = { params: Promise<{ id: string }> };

// GET /api/admin/customers/:id — full customer with wallet, plans (+ health) and orders.
export async function GET(_req: NextRequest, { params }: Params) {
  const gate = await requireAdmin("customers");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      wallet: true,
      plans: { include: { payments: true, product: { select: { name: true } }, order: { select: { reference: true } } } },
      orders: { include: { items: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!customer) return jsonError(404, "Customer not found.");

  const plans = customer.plans.map((p) => {
    const payable = (PAYABLE_PLAN_STATUSES as readonly string[]).includes(p.status);
    return {
      id: p.id,
      type: p.type,
      reference: p.order?.reference ?? null,
      productName: p.product?.name ?? null,
      productPrice: p.productPrice,
      amountAllocated: p.amountAllocated,
      status: p.status,
      delivered: p.status === "delivered" || p.status === "completed",
      health: payable ? planHealthFrom(p, p.payments) : null,
    };
  });

  return NextResponse.json({
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      verified: customer.phoneVerified,
      blocked: customer.blocked,
      joined: customer.createdAt,
      wallet: {
        total: customer.wallet?.totalBalance ?? 0,
        available: customer.wallet?.availableBalance ?? 0,
        spentOnProducts: customer.wallet?.spentOnProducts ?? 0,
      },
      plans,
      orders: customer.orders,
    },
  });
}
