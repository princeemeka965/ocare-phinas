import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { supabase, unwrap } from "@/lib/supabase";
import { currentAdmin, adminCan, jsonError, unauthorized, forbidden } from "@/lib/auth/guards";
import { reversePlan } from "@/lib/server/lifecycle";
import { revertSolarApplicationAfterPlanDeletion } from "@/lib/server/solar-lifecycle";
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
// package swap, a status override, and a direct amountAllocated edit. The
// latter two are deliberate escape hatches with no automatic ledger sync.
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { data: plan } = await supabase.from("Plan").select("*").eq("id", id).maybeSingle<Plan>();
  if (!plan) return jsonError(404, "Plan not found.");

  const g = await gate(plan.type);
  if ("response" in g) return g.response;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Invalid plan details.");
  const { productId, ...rest } = parsed.data;

  const update: Partial<Plan> = { ...rest };

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
