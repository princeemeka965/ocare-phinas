import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { supabase, unwrap } from "@/lib/supabase";
import { requireCustomer, jsonError } from "@/lib/auth/guards";
import { slotsForPrice, SOLO_MIN_DAILY } from "@/lib/pay-small-small";
import { resolveDelivery } from "@/lib/delivery";
import { hasActivePlanOfType, nextOrderReference } from "@/lib/server/lifecycle";
import type { Order, Plan, Product } from "@/lib/db/types";

const schema = z.object({
  productId: z.string(),
  perPayment: z.number().int().min(SOLO_MIN_DAILY),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  deliveryMethod: z.enum(["delivery", "pickup"]).default("delivery"),
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
  const { productId, perPayment, frequency, deliveryMethod, shipping } = parsed.data;

  const { data: product } = await supabase
    .from("Product")
    .select("*")
    .eq("id", productId)
    .eq("active", true)
    .maybeSingle<Product>();
  if (!product) return jsonError(404, "Product not found.");
  if (perPayment > product.price) return jsonError(400, "Your payment amount can't exceed the item price.");

  if (await hasActivePlanOfType(gate.customer.id, "solo")) {
    return jsonError(409, "You already have an active Solo Plan. Complete it before starting another.");
  }

  const { deliveryFee, shipping: ship } = resolveDelivery(deliveryMethod, product.deliveryFee, shipping);

  const plan = unwrap(
    await supabase
      .from("Plan")
      .insert({
        customerId: gate.customer.id,
        type: "solo",
        productId: product.id,
        productPrice: product.price,
        deliveryFee,
        slots: slotsForPrice(product.price),
        perPayment,
        frequency,
        startDate: new Date().toISOString(),
        status: "active",
      })
      .select("*")
      .single(),
  ) as Plan;

  const order = unwrap(
    await supabase
      .from("Order")
      .insert({
        reference: await nextOrderReference(),
        customerId: gate.customer.id,
        status: "in_plan",
        paymentPlan: "solo",
        deliveryMethod,
        subtotal: product.price,
        deliveryFee,
        total: product.price + deliveryFee,
        shipAddress: ship.address,
        shipCity: ship.city,
        shipState: ship.state,
        shipLandmark: ship.landmark ?? null,
        planId: plan.id,
      })
      .select("*")
      .single(),
  ) as Order;

  const items = unwrap(
    await supabase
      .from("OrderItem")
      .insert({
        orderId: order.id,
        productId: product.id,
        name: product.name,
        condition: product.condition,
        price: product.price,
        qty: 1,
        image: product.images[0] ?? null,
      })
      .select("*"),
  );

  return NextResponse.json({ order: { ...order, plan, items } }, { status: 201 });
}
