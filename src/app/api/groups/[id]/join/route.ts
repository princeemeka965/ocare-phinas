import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { supabase, unwrap } from "@/lib/supabase";
import { requireCustomer, jsonError } from "@/lib/auth/guards";
import { getSettings } from "@/lib/settings";
import { isGroupEligible, GROUP_MAX_SLOTS_PER_CUSTOMER } from "@/lib/pay-small-small";
import { resolveDelivery } from "@/lib/delivery";
import { hasActivePlanOfType, nextOrderReference, recordLumpPayment } from "@/lib/server/lifecycle";
import { availableWalletBalance } from "@/lib/server/wallet-breakdown";
import type { Group, Order, Plan, Product } from "@/lib/db/types";

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

  const [groupRes, productRes, settings] = await Promise.all([
    supabase.from("Group").select("*").eq("id", id).maybeSingle<Group>(),
    supabase.from("Product").select("*").eq("id", productId).eq("active", true).maybeSingle<Product>(),
    getSettings(),
  ]);
  const group = groupRes.data;
  const product = productRes.data;
  if (!group || group.status !== "open") return jsonError(404, "This group isn't open to join.");
  if (!product) return jsonError(404, "Product not found.");
  if (!isGroupEligible(product.price)) return jsonError(400, "Group plans are only for items of ₦100,000 or less.");
  if (group.slotsFilled + slots > group.totalSlots) return jsonError(409, "Not enough slots left in this group.");
  if (await hasActivePlanOfType(gate.customer.id, "group")) {
    return jsonError(409, "You already have an active Group Plan. Complete it before joining another.");
  }

  const perPayment = slots * settings.slotDaily;
  const { deliveryFee, shipping: ship } = resolveDelivery(deliveryMethod, product.deliveryFee, shipping);

  const plan = unwrap(
    await supabase
      .from("Plan")
      .insert({
        customerId: gate.customer.id,
        type: "group",
        groupId: group.id,
        productId: product.id,
        productPrice: product.price,
        deliveryFee,
        slots,
        perPayment,
        frequency: "daily",
        startDate: new Date().toISOString(),
        status: "active",
      })
      .select("*")
      .single(),
  ) as Plan;

  await supabase.from("GroupMembership").insert({
    groupId: group.id,
    customerId: gate.customer.id,
    position: group.slotsFilled + 1,
    slotsHeld: slots,
  });

  const slotsFilled = group.slotsFilled + slots;
  await supabase
    .from("Group")
    .update({ slotsFilled, status: slotsFilled >= group.totalSlots ? "closed" : "open" })
    .eq("id", group.id);

  const order = unwrap(
    await supabase
      .from("Order")
      .insert({
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

  // Any uncommitted wallet credit (e.g. from a self-cancelled plan) applies
  // straight away — same lump-payment path an admin's "amount paid" edit
  // uses, just with no admin behind it (see recordLumpPayment's adminId doc).
  let finalPlan: Plan = plan;
  let finalOrder: Order = order;
  const available = await availableWalletBalance(gate.customer.id);
  if (available > 0) {
    const result = await recordLumpPayment(order.id, Math.min(available, product.price + deliveryFee), null);
    if (result.ok) {
      const { data: refreshedOrder } = await supabase.from("Order").select("*").eq("id", order.id).single<Order>();
      const { data: refreshedPlan } = await supabase.from("Plan").select("*").eq("id", plan.id).single<Plan>();
      if (refreshedOrder) finalOrder = refreshedOrder;
      if (refreshedPlan) finalPlan = refreshedPlan;
    }
  }

  return NextResponse.json({ order: { ...finalOrder, plan: finalPlan, items } }, { status: 201 });
}
