import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/auth/guards";
import { isArrears } from "@/lib/payment-health";
import { planHealthFrom, PAYABLE_PLAN_STATUSES } from "@/lib/server/arrears";

// GET /api/me/plans — the customer's plans with derived arrears health (My Plan + banner).
export async function GET() {
  const gate = await requireCustomer();
  if ("response" in gate) return gate.response;

  const plans = await prisma.plan.findMany({
    where: { customerId: gate.customer.id },
    include: {
      payments: true,
      product: { select: { name: true, images: true } },
      order: { select: { reference: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const shaped = plans.map((p) => {
    const payable = (PAYABLE_PLAN_STATUSES as readonly string[]).includes(p.status);
    const health = payable ? planHealthFrom(p, p.payments) : null;
    return {
      id: p.id,
      type: p.type,
      reference: p.order?.reference ?? null,
      productName: p.product?.name ?? null,
      productImage: p.product?.images[0] ?? null,
      productPrice: p.productPrice,
      deliveryFee: p.deliveryFee,
      perPayment: p.perPayment,
      frequency: p.frequency,
      slots: p.slots,
      amountAllocated: p.amountAllocated,
      status: p.status,
      health,
      inArrears: health ? isArrears(health.status) : false,
    };
  });

  return NextResponse.json({ plans: shaped });
}
