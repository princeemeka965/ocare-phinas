import { NextRequest, NextResponse } from "next/server";

import { supabase } from "@/lib/supabase";
import { requireAdmin, jsonError } from "@/lib/auth/guards";
import { planHealthFrom, PAYABLE_PLAN_STATUSES } from "@/lib/server/arrears";
import type { Customer, Order, OrderItem, Plan, PlanPayment, Wallet } from "@/lib/db/types";

type Params = { params: Promise<{ id: string }> };

type ToOne<T> = T | T[] | null;
const one = <T>(v: ToOne<T>): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

// GET /api/admin/customers/:id — full customer with wallet, plans (+ health) and orders.
export async function GET(_req: NextRequest, { params }: Params) {
  const gate = await requireAdmin("customers");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const { data: customer } = await supabase
    .from("Customer")
    .select(
      "*, wallet:Wallet(*), plans:Plan(*, payments:PlanPayment(*), product:Product(name), order:Order(reference)), orders:Order(*, items:OrderItem(*))",
    )
    .eq("id", id)
    .maybeSingle<
      Customer & {
        wallet: Wallet | null;
        plans: (Plan & {
          payments: PlanPayment[];
          product: ToOne<{ name: string }>;
          order: ToOne<{ reference: string }>;
        })[];
        orders: (Order & { items: OrderItem[] })[];
      }
    >();
  if (!customer) return jsonError(404, "Customer not found.");

  const orders = [...customer.orders].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const plans = customer.plans.map((p) => {
    const payable = (PAYABLE_PLAN_STATUSES as readonly string[]).includes(p.status);
    return {
      id: p.id,
      type: p.type,
      reference: one(p.order)?.reference ?? null,
      productName: one(p.product)?.name ?? null,
      productPrice: p.productPrice,
      amountAllocated: p.amountAllocated,
      status: p.status,
      delivered: p.status === "delivered" || p.status === "completed",
      health: payable ? planHealthFrom(p, p.payments) : null,
    };
  });

  return NextResponse.json({
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      verified: customer.phoneVerified,
      blocked: customer.blocked,
      joined: customer.createdAt,
      wallet: {
        total: customer.wallet?.totalBalance ?? 0,
        available: customer.wallet?.availableBalance ?? 0,
        spentOnProducts: customer.wallet?.spentOnProducts ?? 0,
      },
      plans,
      orders,
    },
  });
}
