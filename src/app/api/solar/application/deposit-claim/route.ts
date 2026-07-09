import { NextResponse } from "next/server";

import { requireCustomer, jsonError } from "@/lib/auth/guards";
import { submitSolarDepositClaim } from "@/lib/server/solar-lifecycle";

// POST /api/solar/application/deposit-claim — customer says they've transferred the deposit.
export async function POST() {
  const gate = await requireCustomer();
  if ("response" in gate) return gate.response;

  const result = await submitSolarDepositClaim(gate.customer.id);
  if (!result.ok) return jsonError(result.status, result.error);
  return NextResponse.json({ application: result.application });
}
