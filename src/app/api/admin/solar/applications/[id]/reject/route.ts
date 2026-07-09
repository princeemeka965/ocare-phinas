import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin, jsonError } from "@/lib/auth/guards";
import { rejectSolarApplication } from "@/lib/server/solar-lifecycle";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({ reason: z.string().min(1) });

// POST /api/admin/solar/applications/:id/reject — reject KYC with a reason.
export async function POST(req: NextRequest, { params }: Params) {
  const gate = await requireAdmin("solar");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "A rejection reason is required.");

  const result = await rejectSolarApplication(id, gate.admin.id, parsed.data.reason);
  if (!result.ok) return jsonError(result.status, result.error);
  return NextResponse.json({ application: result.application });
}
