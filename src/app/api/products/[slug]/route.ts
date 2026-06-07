import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/auth/guards";
import {
  planMath,
  isGroupEligible,
  groupSlotsForPrice,
  suggestedSoloAmount,
  SOLO_MIN_DAILY,
} from "@/lib/pay-small-small";

type Params = { params: Promise<{ slug: string }> };

/** Pay Small Small figures for the product detail's payment chooser (kept helpers). */
function planSummary(price: number) {
  const pm = planMath(price);
  const groupEligible = isGroupEligible(price);
  return {
    slots: pm.slots,
    daily: pm.daily,
    daysToComplete: pm.daysToComplete,
    deliveryTarget: pm.deliveryTarget,
    daysToDelivery: pm.daysToDelivery,
    groupEligible,
    groupSlots: groupEligible ? groupSlotsForPrice(price) : null,
    soloMinDaily: SOLO_MIN_DAILY,
    suggestedSoloDaily: {
      daily: suggestedSoloAmount(price, "daily"),
      weekly: suggestedSoloAmount(price, "weekly"),
      monthly: suggestedSoloAmount(price, "monthly"),
    },
  };
}

// Public — single product by slug.
export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug, active: true },
    include: {
      category: { select: { name: true, slug: true } },
      brand: { select: { name: true, slug: true } },
    },
  });
  if (!product) return jsonError(404, "Product not found.");

  return NextResponse.json({ product, plan: planSummary(product.price) });
}
