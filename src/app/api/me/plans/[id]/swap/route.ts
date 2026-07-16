import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { supabase, unwrap } from "@/lib/supabase";
import { requireCustomer, jsonError } from "@/lib/auth/guards";
import { getSettings } from "@/lib/settings";
import { isGroupEligible, groupSlotsForPrice, slotsForPrice } from "@/lib/pay-small-small";
import { resolveDelivery } from "@/lib/delivery";
import { resolveSubstitution } from "@/lib/server/lifecycle";
import type { Order, OrderItem, Plan, Product } from "@/lib/db/types";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({ productId: z.string() });

// POST /api/me/plans/:id/swap — customer self-service: redirect a plan's
// payments toward a different product. "active" (pre-delivery) plans work the
// same way an admin's product swap does today (PATCH /api/admin/plans/:id),
// but this also keeps Order/OrderItem in sync, which that admin path leaves
// stale. "awaiting_substitution" plans (the original item sold out right at
// the goods trigger — see confirmPlanPeriod, §7) are the other case this
// covers: the customer already crossed the trigger, so instead of just
// re-pointing the plan we also apply the deferred stock/wallet/group effects
// via resolveSubstitution, landing the plan on delivered/completed like a
// normal confirm would have.
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const gate = await requireCustomer();
  if ("response" in gate) return gate.response;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Choose a product to switch to.");

  const { data: plan } = await supabase
    .from("Plan")
    .select("*")
    .eq("id", id)
    .eq("customerId", gate.customer.id)
    .maybeSingle<Plan>();
  if (!plan) return jsonError(404, "Plan not found.");
  if (plan.type !== "solo" && plan.type !== "group") {
    return jsonError(400, "This plan can't be switched online — contact support.");
  }
  const awaitingSubstitution = plan.status === "awaiting_substitution";
  if (plan.status !== "active" && !awaitingSubstitution) {
    return jsonError(409, "This plan can no longer be switched online — contact support.");
  }

  const { data: product } = await supabase
    .from("Product")
    .select("*, brand:Brand(name)")
    .eq("id", parsed.data.productId)
    .eq("active", true)
    .maybeSingle<Product & { brand: { name: string } | { name: string }[] | null }>();
  if (!product) return jsonError(404, "Product not found.");
  const brandName = Array.isArray(product.brand) ? (product.brand[0]?.name ?? null) : (product.brand?.name ?? null);
  if (product.id === plan.productId) return jsonError(400, "That's already what this plan is paying toward.");

  if (awaitingSubstitution) {
    // Already crossed the goods trigger on the old item — the replacement
    // must be available now, or there's nothing to hand over.
    if (product.stockQuantity <= 0) return jsonError(409, `${product.name} is also out of stock — pick another item.`);
  } else {
    const newGoodsTrigger = Math.round(product.price * (plan.type === "solo" ? 0.5 : 1));
    if (plan.amountAllocated >= newGoodsTrigger) {
      return jsonError(
        409,
        "Your balance already covers half this item's price — contact support to switch to something this close to paid off.",
      );
    }
  }

  const { data: order } = await supabase
    .from("Order")
    .select("*")
    .eq("planId", plan.id)
    .maybeSingle<Order>();
  if (!order) return jsonError(409, "No order is linked to this plan — contact support.");

  let slots = plan.slots;
  let perPayment = plan.perPayment;

  if (plan.type === "group") {
    if (!isGroupEligible(product.price)) {
      return jsonError(400, "Group plans are only for items ₦100,000 or less — try a Solo plan instead.");
    }
    const newSlots = groupSlotsForPrice(product.price);
    if (newSlots !== plan.slots) {
      return jsonError(400, "This item needs a different number of group slots — contact support to switch.");
    }
    const settings = await getSettings();
    perPayment = slots * settings.slotDaily;
  } else {
    slots = slotsForPrice(product.price);
  }

  const { deliveryFee } = resolveDelivery(order.deliveryMethod, product.deliveryFee);

  const resolved = awaitingSubstitution ? await resolveSubstitution(plan, product, deliveryFee) : null;

  const updated = unwrap(
    await supabase
      .from("Plan")
      .update({
        productId: product.id,
        productPrice: product.price,
        deliveryFee,
        slots,
        perPayment,
        originalProductId: plan.originalProductId ?? plan.productId,
        ...(resolved ? { status: resolved.planStatus } : {}),
      })
      .eq("id", plan.id)
      .select("*")
      .single(),
  ) as Plan;

  await supabase
    .from("Order")
    .update({
      subtotal: product.price,
      deliveryFee,
      total: product.price + deliveryFee,
      ...(resolved ? { status: resolved.orderStatus } : {}),
    })
    .eq("id", order.id);

  await supabase
    .from("OrderItem")
    .update({
      productId: product.id,
      name: product.name,
      brand: brandName,
      condition: product.condition,
      price: product.price,
      image: product.images[0] ?? null,
    } satisfies Partial<OrderItem>)
    .eq("orderId", order.id);

  return NextResponse.json({ plan: updated });
}
