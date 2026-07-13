import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { supabase, unwrap } from "@/lib/supabase";
import { currentAdmin, adminCan, jsonError, unauthorized, forbidden } from "@/lib/auth/guards";
import { reversePlan, recordLumpPayment, adjustWalletTotal } from "@/lib/server/lifecycle";
import { revertSolarApplicationAfterPlanDeletion, recordSolarLumpPayment } from "@/lib/server/solar-lifecycle";
import { resolveDelivery } from "@/lib/delivery";
import type { AdminPermission } from "@/lib/admin-access";
import type { Order, Plan, Product } from "@/lib/db/types";

type Params = { params: Promise<{ id: string }> };

/** Plan actions are gated by whichever area the plan belongs to — "solar"
 *  for solar plans, "orders" for solo/group (reached via the order detail
 *  page). The permission can't be known until the Plan row is fetched, so
 *  this is a two-step gate rather than a single requireAdmin(perm) call. */
async function gate(planType: Plan["type"]) {
  const admin = await currentAdmin();
  if (!admin) return { response: unauthorized() };
  const perm: AdminPermission = planType === "solar" ? "solar" : "orders";
  if (!adminCan(admin, perm)) return { response: forbidden(perm) };
  return { admin };
}

const patchSchema = z
  .object({
    frequency: z.enum(["daily", "weekly", "monthly"]),
    startDate: z.string(),
    perPayment: z.number().int().min(1),
    slots: z.number().int().min(1),
    productId: z.string().nullable(),
    status: z.enum([
      "active",
      "processing",
      "delivered",
      "completed",
      "awaiting_substitution",
      "awaiting_installation",
      "defaulted",
    ]),
    amountAllocated: z.number().int().min(0),
  })
  .partial();

// PATCH /api/admin/plans/:id — manual corrections: schedule fields, product/
// package swap, a status override, and an amount-paid edit. Raising
// amountAllocated is routed through the same period-confirm ledger path as a
// normal payment (recordLumpPayment/recordSolarLumpPayment) — it fills whole
// periods and credits the wallet for real, rather than writing the column
// raw. Lowering it is treated as a correction to a past over-record: the
// column is written directly, but the wallet is debited by the same delta so
// it never drifts out of reconciliation (see wallet-breakdown.ts). Status
// remains a direct escape hatch with no ledger sync.
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { data: plan } = await supabase.from("Plan").select("*").eq("id", id).maybeSingle<Plan>();
  if (!plan) return jsonError(404, "Plan not found.");

  const g = await gate(plan.type);
  if ("response" in g) return g.response;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Invalid plan details.");
  const { productId, amountAllocated: requestedAmount, ...rest } = parsed.data;

  const update: Partial<Plan> = { ...rest };
  // The edit dialog always submits the plan's status as it stood when the
  // dialog opened, even if the admin only meant to touch amount/schedule
  // fields. Treating "unchanged" as "no opinion" avoids stomping a status
  // transition that a lump-payment confirm below makes in the meantime
  // (e.g. crossing the processing/delivered threshold).
  if (update.status === plan.status) delete update.status;

  if (productId !== undefined && productId !== plan.productId) {
    if (productId === null) {
      update.productId = null;
    } else {
      const { data: product } = await supabase.from("Product").select("*").eq("id", productId).maybeSingle<Product>();
      if (!product) return jsonError(404, "Product not found.");
      update.productId = product.id;
      update.productPrice = product.price;
      if (plan.type !== "solar") {
        const { data: order } = await supabase
          .from("Order")
          .select("deliveryMethod")
          .eq("planId", plan.id)
          .maybeSingle<Pick<Order, "deliveryMethod">>();
        update.deliveryFee = order ? resolveDelivery(order.deliveryMethod, product.deliveryFee).deliveryFee : product.deliveryFee;
      }
      if (!plan.originalProductId) update.originalProductId = plan.productId;
    }
  }

  if (requestedAmount !== undefined && requestedAmount !== plan.amountAllocated) {
    const delta = requestedAmount - plan.amountAllocated;

    if (delta > 0 && plan.type === "solar" && plan.status === "active" && plan.solarApplicationId) {
      const result = await recordSolarLumpPayment(plan.solarApplicationId, delta, g.admin.id);
      if (!result.ok) return jsonError(result.status, result.error);
    } else if (delta > 0 && plan.type !== "solar") {
      const { data: order } = await supabase
        .from("Order")
        .select("id")
        .eq("planId", plan.id)
        .maybeSingle<Pick<Order, "id">>();
      if (!order) return jsonError(409, "No order is linked to this plan — can't record a payment against it.");
      const result = await recordLumpPayment(order.id, delta, g.admin.id);
      if (!result.ok) return jsonError(result.status, result.error);
    } else {
      // Solar plans not yet in active repayment (deposit stage) have no period
      // schedule to fill, and any decrease is a correction, not a payment —
      // both just move the raw total and reconcile the wallet by the delta.
      await adjustWalletTotal(plan.customerId, delta);
      update.amountAllocated = requestedAmount;
    }
  }

  const updated = unwrap(
    await supabase.from("Plan").update(update).eq("id", id).select("*").single(),
  ) as Plan;
  return NextResponse.json({ plan: updated });
}

// DELETE /api/admin/plans/:id — reverse every wallet/stock/group-slot effect
// (reversePlan) and hard-delete the plan. Solo/Group plans also cancel their
// linked Order (planId cleared — required before the Plan row can go, since
// Order.planId has no ON DELETE clause); solar plans reset the
// SolarApplication back to awaiting-deposit.
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { data: plan } = await supabase.from("Plan").select("*").eq("id", id).maybeSingle<Plan>();
  if (!plan) return jsonError(404, "Plan not found.");

  const g = await gate(plan.type);
  if ("response" in g) return g.response;

  try {
    if (plan.type === "solar") {
      if (!plan.solarApplicationId) return jsonError(500, "This solar plan has no linked application.");
      await reversePlan(plan);
      await revertSolarApplicationAfterPlanDeletion(plan.solarApplicationId, plan);
    } else {
      const { data: order } = await supabase
        .from("Order")
        .select("id")
        .eq("planId", plan.id)
        .maybeSingle<Pick<Order, "id">>();
      await reversePlan(plan);
      // reversePlan() already detached Order.planId (required before it could
      // delete the Plan row) — this only needs to set the fulfilment status.
      if (order) {
        await supabase.from("Order").update({ status: "cancelled" }).eq("id", order.id);
      }
    }
  } catch (err) {
    return jsonError(500, err instanceof Error ? err.message : "Couldn't delete the plan.");
  }

  return NextResponse.json({ ok: true });
}
