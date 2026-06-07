import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin, jsonError } from "@/lib/auth/guards";
import { confirmPlanPeriod } from "@/lib/server/lifecycle";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({ periodIndex: z.number().int().min(1) });

// POST /api/admin/orders/:id/payments — confirm ONE manual plan payment period.
// Idempotent; advances the plan/order and arrears per payment-flow §14.
export async function POST(req: NextRequest, { params }: Params) {
  const gate = await requireAdmin("orders");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "A period number is required.");

  const result = await confirmPlanPeriod(id, parsed.data.periodIndex, gate.admin.id);
  if (!result.ok) return jsonError(result.status, result.error);
  return NextResponse.json(result);
}
