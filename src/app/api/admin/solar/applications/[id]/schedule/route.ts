import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin, jsonError } from "@/lib/auth/guards";
import { scheduleSolarInstallation } from "@/lib/server/solar-lifecycle";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  date: z.string().min(1),
  time: z.string().min(1),
  notes: z.string().optional(),
});

// POST /api/admin/solar/applications/:id/schedule — set (or change) the
// installation date/time.
export async function POST(req: NextRequest, { params }: Params) {
  const gate = await requireAdmin("solar");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "An installation date and time are required.");

  const result = await scheduleSolarInstallation(id, gate.admin.id, parsed.data.date, parsed.data.time, parsed.data.notes);
  if (!result.ok) return jsonError(result.status, result.error);
  return NextResponse.json({ application: result.application, installation: result.installation });
}
