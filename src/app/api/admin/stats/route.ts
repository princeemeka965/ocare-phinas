import { NextResponse } from "next/server";

import { supabase, unwrap } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth/guards";
import { plansInArrears } from "@/lib/server/arrears";
import { LOW_STOCK_THRESHOLD } from "@/lib/slug";

// GET /api/admin/stats — dashboard figures.
export async function GET() {
  const gate = await requireAdmin("dashboard");
  if ("response" in gate) return gate.response;

  const [awaitingRes, openGroupsRes, lowStockRes, recentRes, arrears] = await Promise.all([
    supabase.from("Order").select("*", { count: "exact", head: true }).eq("status", "payment_submitted"),
    supabase.from("Group").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("Product").select("*", { count: "exact", head: true }).lt("stockQuantity", LOW_STOCK_THRESHOLD),
    supabase
      .from("Order")
      .select("*, customer:Customer(name)")
      .order("createdAt", { ascending: false })
      .limit(5),
    plansInArrears(),
  ]);

  const awaitingConfirmation = awaitingRes.count ?? 0;
  const openGroups = openGroupsRes.count ?? 0;
  const lowStock = lowStockRes.count ?? 0;
  const recentOrders = unwrap(recentRes);

  const overdue = arrears.filter((r) => r.health.status === "overdue");
  const missed = arrears.filter((r) => r.health.status === "missed");

  return NextResponse.json({
    awaitingConfirmation,
    openGroups,
    lowStock,
    overdue: { count: overdue.length, total: overdue.reduce((s, r) => s + r.health.arrears, 0) },
    missed: { count: missed.length, total: missed.reduce((s, r) => s + r.health.arrears, 0) },
    recentOrders,
  });
}
