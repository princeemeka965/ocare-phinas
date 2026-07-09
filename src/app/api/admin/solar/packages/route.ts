import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { supabase, unwrap } from "@/lib/supabase";
import { requireAdmin, jsonError } from "@/lib/auth/guards";

// GET /api/admin/solar/packages — every package (active + inactive).
export async function GET() {
  const gate = await requireAdmin("solar");
  if ("response" in gate) return gate.response;

  const packages = unwrap(
    await supabase.from("SolarPackage").select("*").order("createdAt", { ascending: true }),
  );
  return NextResponse.json({ packages });
}

const cadenceOptionSchema = z.object({
  frequency: z.enum(["daily", "weekly", "monthly"]),
  amount: z.number().int().positive(),
});

const schema = z.object({
  name: z.string().min(2),
  description: z.string().default(""),
  registrationFee: z.number().int().nonnegative(),
  initialDeposit: z.number().int().nonnegative(),
  totalAmount: z.number().int().positive(),
  cadenceOptions: z.array(cadenceOptionSchema).min(1),
  active: z.boolean().default(true),
});

// POST /api/admin/solar/packages — create a new package.
export async function POST(req: NextRequest) {
  const gate = await requireAdmin("solar");
  if ("response" in gate) return gate.response;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Name, fee/deposit/total amounts and at least one cadence option are required.");

  const pkg = unwrap(await supabase.from("SolarPackage").insert(parsed.data).select("*").single());
  return NextResponse.json({ package: pkg }, { status: 201 });
}
