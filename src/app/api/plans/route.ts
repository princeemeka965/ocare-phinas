import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireCustomer, jsonError } from "@/lib/auth/guards";
import { getSettings } from "@/lib/settings";
import { slotsForPrice, SOLO_MIN_DAILY } from "@/lib/pay-small-small";
import { hasActivePlanOfType, nextOrderReference } from "@/lib/server/lifecycle";

const schema = z.object({
  productId: z.string(),
  perPayment: z.number().int().min(SOLO_MIN_DAILY),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  shipping: z
    .object({ address: z.string(), city: z.string(), state: z.string(), landmark: z.string().optional() })
    .optional(),
});

// POST /api/plans — start a Solo plan (one active solo per customer, §1).
export async function POST(req: NextRequest) {
  const gate = await requireCustomer();
  if ("response" in gate) return gate.response;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Invalid plan details.");
  const { productId, perPayment, frequency, shipping } = parsed.data;

  const product = await prisma.product.findFirst({ where: { id: productId, active: true } });
  if (!product) return jsonError(404, "Product not found.");
  if (perPayment > product.price) return jsonError(400, "Your payment amount can't exceed the item price.");

  if (await hasActivePlanOfType(gate.customer.id, "solo")) {
    return jsonError(409, "You already have an active Solo Plan. Complete it before starting another.");
  }

  const settings = await getSettings();
  const order = await prisma.$transaction(async (tx) => {
    const plan = await tx.plan.create({
      data: {
        customerId: gate.customer.id,
        type: "solo",
        productId: product.id,
        productPrice: product.price,
        slots: slotsForPrice(product.price),
        perPayment,
        frequency,
        startDate: new Date(),
        status: "active",
      },
    });
    return tx.order.create({
      data: {
        reference: await nextOrderReference(),
        customerId: gate.customer.id,
        status: "in_plan",
        paymentPlan: "solo",
        subtotal: product.price,
        deliveryFee: settings.deliveryFee,
        total: product.price + settings.deliveryFee,
        shipAddress: shipping?.address ?? "",
        shipCity: shipping?.city ?? "",
        shipState: shipping?.state ?? "",
        shipLandmark: shipping?.landmark,
        planId: plan.id,
        items: {
          create: {
            productId: product.id,
            name: product.name,
            condition: product.condition,
            price: product.price,
            qty: 1,
            image: product.images[0] ?? null,
          },
        },
      },
      include: { plan: true, items: true },
    });
  });

  return NextResponse.json({ order }, { status: 201 });
}
