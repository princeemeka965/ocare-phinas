import { NextRequest, NextResponse } from "next/server";

import { supabase, unwrap } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth/guards";
import type { Order, OrderItem, OrderStatus } from "@/lib/db/types";

const STATUSES = new Set<OrderStatus>([
  "pending_payment", "payment_submitted", "in_plan", "confirmed", "processing", "shipped", "delivered", "cancelled",
]);

type AdminOrderRow = Order & {
  customer: { name: string; email: string; phone: string } | null;
  items: OrderItem[];
};

// GET /api/admin/orders?status=&q=
export async function GET(req: NextRequest) {
  const gate = await requireAdmin("orders");
  if ("response" in gate) return gate.response;

  const sp = req.nextUrl.searchParams;
  let query = supabase
    .from("Order")
    .select("*, customer:Customer(name,email,phone), items:OrderItem(*), plan:Plan(*)")
    .order("createdAt", { ascending: false });

  const status = sp.get("status");
  if (status && STATUSES.has(status as OrderStatus)) query = query.eq("status", status);

  let orders = unwrap(await query) as AdminOrderRow[];

  // The free-text query spans the reference, customer name/phone and item names
  // (across related tables), so it's applied in-memory after the fetch.
  const q = sp.get("q")?.trim();
  if (q) {
    const ql = q.toLowerCase();
    orders = orders.filter(
      (o) =>
        o.reference.toLowerCase().includes(ql) ||
        (o.customer?.name ?? "").toLowerCase().includes(ql) ||
        (o.customer?.phone ?? "").toLowerCase().includes(ql) ||
        o.items.some((it) => it.name.toLowerCase().includes(ql)),
    );
  }

  return NextResponse.json({ orders });
}
