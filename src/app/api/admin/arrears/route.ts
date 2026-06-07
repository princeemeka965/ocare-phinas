import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/guards";
import { plansInArrears } from "@/lib/server/arrears";

// GET /api/admin/arrears — every plan currently missed or overdue.
export async function GET() {
  const gate = await requireAdmin("arrears");
  if ("response" in gate) return gate.response;

  const rows = await plansInArrears();
  const shaped = rows.map((r) => ({
    customer: r.customer,
    plan: {
      id: r.plan.id,
      type: r.plan.type,
      reference: r.plan.order?.reference ?? null,
      productName: r.plan.product?.name ?? null,
      delivered: r.plan.status === "delivered" || r.plan.status === "completed",
    },
    health: r.health,
  }));

  const overdueTotal = shaped.filter((r) => r.health.status === "overdue").reduce((s, r) => s + r.health.arrears, 0);
  const missedTotal = shaped.filter((r) => r.health.status === "missed").reduce((s, r) => s + r.health.arrears, 0);

  return NextResponse.json({ rows: shaped, overdueTotal, missedTotal });
}
