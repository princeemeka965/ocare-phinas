import { NextRequest, NextResponse } from "next/server";

import { requireAdmin, jsonError } from "@/lib/auth/guards";
import { confirmSolarDeposit } from "@/lib/server/solar-lifecycle";

type Params = { params: Promise<{ id: string }> };

// POST /api/admin/solar/applications/:id/confirm-deposit — confirm the initial
// deposit; creates the real Plan row for the ongoing balance repayment.
export async function POST(_req: NextRequest, { params }: Params) {
  const gate = await requireAdmin("solar");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const result = await confirmSolarDeposit(id);
  if (!result.ok) return jsonError(result.status, result.error);
  return NextResponse.json({ application: result.application, plan: result.plan });
}
