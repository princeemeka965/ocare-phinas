import { NextRequest, NextResponse } from "next/server";

import { requireAdmin, jsonError } from "@/lib/auth/guards";
import { approveSolarApplication } from "@/lib/server/solar-lifecycle";

type Params = { params: Promise<{ id: string }> };

// POST /api/admin/solar/applications/:id/approve — approve KYC; also books the
// (non-refundable) registration fee — there's no separate confirm step for it.
export async function POST(_req: NextRequest, { params }: Params) {
  const gate = await requireAdmin("solar");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const result = await approveSolarApplication(id, gate.admin.id);
  if (!result.ok) return jsonError(result.status, result.error);
  return NextResponse.json({ application: result.application });
}
