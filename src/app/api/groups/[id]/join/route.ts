import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireCustomer, jsonError } from "@/lib/auth/guards";
import { getSettings } from "@/lib/settings";
import { isGroupEligible, GROUP_MAX_SLOTS_PER_CUSTOMER } from "@/lib/pay-small-small";
import { resolveDelivery } from "@/lib/delivery";
import { hasActivePlanOfType, nextOrderReference } from "@/lib/server/lifecycle";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  productId: z.string(),
  slots: z.number().int().min(1).max(GROUP_MAX_SLOTS_PER_CUSTOMER),
  deliveryMethod: z.enum(["delivery", "pickup"]).default("delivery"),
  shipping: z
    .object({ address: z.string(), city: z.string(), state: z.string(), landmark: z.string().optional() })
    .optional(),
});

// POST /api/groups/:id/join — join a group toward a chosen item (≤ ₦100k), §5.3.
export async function POST(req: NextRequest, { params }: Params) {
  const gate = await requireCustomer();
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Choose a product and 1–2 slots.");
  const { productId, slots, deliveryMethod, shipping } = parsed.data;

  const [group, product, settings] = await Promise.all([
    prisma.group.findUnique({ where: { id } }),
    prisma.product.findFirst({ where: { id: productId, active: true } }),
    getSettings(),
  ]);
  if (!group || group.status !== "open") return jsonError(404, "This group isn't open to join.");
  if (!product) return jsonError(404, "Product not found.");
  if (!isGroupEligible(product.price)) return jsonError(400, "Group plans are only for items of ₦100,000 or less.");
  if (group.slotsFilled + slots > group.totalSlots) return jsonError(409, "Not enough slots left in this group.");
  if (await hasActivePlanOfType(gate.customer.id, "group")) {
    return jsonError(409, "You already have an active Group Plan. Complete it before joining another.");
  }

  const perPayment = slots * settings.slotDaily;
  const { deliveryFee, shipping: ship } = resolveDelivery(deliveryMethod, product.deliveryFee, shipping);

  const order = await prisma.$transaction(async (tx) => {
    const plan = await tx.plan.create({
      data: {
        customerId: gate.customer.id,
        type: "group",
        groupId: group.id,
        productId: product.id,
        productPrice: product.price,
        deliveryFee,
        slots,
        perPayment,
        frequency: "daily",
        startDate: new Date(),
        status: "active",
      },
    });
    await tx.groupMembership.create({
      data: { groupId: group.id, customerId: gate.customer.id, position: group.slotsFilled + 1, slotsHeld: slots },
    });
    const slotsFilled = group.slotsFilled + slots;
    await tx.group.update({
      where: { id: group.id },
      data: { slotsFilled, status: slotsFilled >= group.totalSlots ? "closed" : "open" },
    });
    return tx.order.create({
      data: {
        reference: await nextOrderReference(),
        customerId: gate.customer.id,
        status: "in_plan",
        paymentPlan: "group",
        deliveryMethod,
        subtotal: product.price,
        deliveryFee,
        total: product.price + deliveryFee,
        shipAddress: ship.address,
        shipCity: ship.city,
        shipState: ship.state,
        shipLandmark: ship.landmark,
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
