import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { supabase, unwrap } from "@/lib/supabase";
import { requireAdmin, jsonError } from "@/lib/auth/guards";

type Params = { params: Promise<{ id: string }> };

const cadenceOptionSchema = z.object({
  frequency: z.enum(["daily", "weekly", "monthly"]),
  amount: z.number().int().positive(),
});

const schema = z
  .object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    registrationFee: z.number().int().nonnegative().optional(),
    initialDeposit: z.number().int().nonnegative().optional(),
    totalAmount: z.number().int().positive().optional(),
    cadenceOptions: z.array(cadenceOptionSchema).min(1).optional(),
    active: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Nothing to update." });

// PATCH /api/admin/solar/packages/:id — edit a package.
export async function PATCH(req: NextRequest, { params }: Params) {
  const gate = await requireAdmin("solar");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Nothing valid to update.");

  const { data: exists } = await supabase.from("SolarPackage").select("id").eq("id", id).maybeSingle();
  if (!exists) return jsonError(404, "Package not found.");

  const pkg = unwrap(await supabase.from("SolarPackage").update(parsed.data).eq("id", id).select("*").single());
  return NextResponse.json({ package: pkg });
}

// DELETE /api/admin/solar/packages/:id — remove a package (blocked if any application references it).
export async function DELETE(_req: NextRequest, { params }: Params) {
  const gate = await requireAdmin("solar");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const { count } = await supabase.from("SolarApplication").select("*", { count: "exact", head: true }).eq("packageId", id);
  const applications = count ?? 0;
  if (applications > 0) {
    return jsonError(409, `This package has ${applications} application(s) referencing it. Deactivate it instead.`);
  }

  await supabase.from("SolarPackage").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
