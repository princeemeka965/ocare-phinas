import { NextResponse } from "next/server";

import { supabase, unwrap } from "@/lib/supabase";
import { requireCustomer } from "@/lib/auth/guards";
import { isArrears } from "@/lib/payment-health";
import { planHealthFrom, PAYABLE_PLAN_STATUSES } from "@/lib/server/arrears";
import type { Plan, PlanPayment } from "@/lib/db/types";

type ToOne<T> = T | T[] | null;
const one = <T>(v: ToOne<T>): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

// GET /api/me/plans — the customer's plans with derived arrears health (My Plan + banner).
export async function GET() {
  const gate = await requireCustomer();
  if ("response" in gate) return gate.response;

  const rows = unwrap(
    await supabase
      .from("Plan")
      .select(
        "*, payments:PlanPayment(*), product:Product(name,images), order:Order(reference,status)",
      )
      .eq("customerId", gate.customer.id)
      // Cancelled plans (self-service cancel — see cancelPlanForCredit) are
      // kept for audit but no longer belong on the customer's active board.
      .neq("status", "cancelled")
      // Solar plans have their own dedicated card (SolarPlanCard, fed by
      // /api/solar/application) and their own status machine (e.g.
      // "awaiting_installation", "defaulted") that MyPlanBoard's TYPE_META/
      // STATUS_META don't recognise — including them here throws mid-render
      // and blanks the whole "Your purchases" list, not just the solar row.
      .neq("type", "solar")
      .order("createdAt", { ascending: false }),
  ) as (Plan & {
    payments: PlanPayment[];
    product: ToOne<{ name: string; images: string[] }>;
    order: ToOne<{ reference: string; status: string }>;
  })[];

  const shaped = rows.map((p) => {
    const product = one(p.product);
    const order = one(p.order);
    const payable = (PAYABLE_PLAN_STATUSES as readonly string[]).includes(p.status);
    const health = payable ? planHealthFrom(p, p.payments) : null;
    return {
      id: p.id,
      type: p.type,
      reference: order?.reference ?? null,
      productId: p.productId,
      productName: product?.name ?? null,
      productImage: product?.images[0] ?? null,
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
