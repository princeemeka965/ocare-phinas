import { NextRequest, NextResponse } from "next/server";

import { requireAdmin, jsonError } from "@/lib/auth/guards";
import { rejectSolarDeposit } from "@/lib/server/solar-lifecycle";

type Params = { params: Promise<{ id: string }> };

// POST /api/admin/solar/applications/:id/reject-deposit — reject a claimed deposit
// payment; the customer can resubmit. No Plan is created.
export async function POST(_req: NextRequest, { params }: Params) {
  const gate = await requireAdmin("solar");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const result = await rejectSolarDeposit(id);
  if (!result.ok) return jsonError(result.status, result.error);
  return NextResponse.json({ application: result.application });
}
