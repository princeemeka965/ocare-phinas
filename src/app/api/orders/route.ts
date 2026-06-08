import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireCustomer, jsonError } from "@/lib/auth/guards";
import { getSettings } from "@/lib/settings";
import { resolveDelivery } from "@/lib/delivery";
import { nextOrderReference } from "@/lib/server/lifecycle";

// GET /api/orders — the signed-in customer's orders.
export async function GET() {
  const gate = await requireCustomer();
  if ("response" in gate) return gate.response;

  const orders = await prisma.order.findMany({
    where: { customerId: gate.customer.id },
    include: { items: true, plan: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ orders });
}

const schema = z.object({
  items: z.array(z.object({ id: z.string(), qty: z.number().int().min(1) })).min(1),
  deliveryMethod: z.enum(["delivery", "pickup"]).default("delivery"),
  shipping: z.object({
    address: z.string().min(3),
    city: z.string().min(2),
    state: z.string().min(2),
    landmark: z.string().optional(),
  }),
});

// POST /api/orders — create a pending outright order (no stock change until an admin confirms).
export async function POST(req: NextRequest) {
  const gate = await requireCustomer();
  if ("response" in gate) return gate.response;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Invalid order — items and shipping are required.");
  const { items, deliveryMethod, shipping } = parsed.data;

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.id) } },
    include: { brand: { select: { name: true } } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines = items.map((i) => ({ item: i, product: byId.get(i.id) }));
  const problem = lines.find((l) => !l.product || !l.product.active || l.product.stockQuantity < l.item.qty);
  if (problem) {
    return jsonError(409, `"${problem.product?.name ?? "An item"}" is unavailable or out of stock. Update your cart.`);
  }

  const settings = await getSettings();
  const subtotal = lines.reduce((s, l) => s + l.product!.price * l.item.qty, 0);
  const { deliveryFee, shipping: ship } = resolveDelivery(deliveryMethod, settings.deliveryFee, shipping);

  const order = await prisma.order.create({
    data: {
      reference: await nextOrderReference(),
      customerId: gate.customer.id,
      status: "pending_payment",
      paymentPlan: "outright",
      deliveryMethod,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      shipAddress: ship.address,
      shipCity: ship.city,
      shipState: ship.state,
      shipLandmark: ship.landmark,
      items: {
        create: lines.map((l) => ({
          productId: l.product!.id,
          name: l.product!.name,
          brand: l.product!.brand?.name,
          condition: l.product!.condition,
          price: l.product!.price,
          qty: l.item.qty,
          image: l.product!.images[0] ?? null,
        })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json({ order }, { status: 201 });
}
