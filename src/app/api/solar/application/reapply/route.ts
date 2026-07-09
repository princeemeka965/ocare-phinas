import { NextResponse } from "next/server";

import { requireCustomer, jsonError } from "@/lib/auth/guards";
import { reapplySolarApplication } from "@/lib/server/solar-lifecycle";

// POST /api/solar/application/reapply — re-open a rejected application for another review pass.
export async function POST() {
  const gate = await requireCustomer();
  if ("response" in gate) return gate.response;

  const result = await reapplySolarApplication(gate.customer.id);
  if (!result.ok) return jsonError(result.status, result.error);
  return NextResponse.json({ application: result.application });
}
