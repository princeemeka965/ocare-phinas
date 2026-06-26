import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { supabase, unwrap } from "@/lib/supabase";
import { getSettings } from "@/lib/settings";
import { requireAdmin, jsonError } from "@/lib/auth/guards";

export async function GET() {
  const gate = await requireAdmin("settings");
  if ("response" in gate) return gate.response;
  return NextResponse.json({ settings: await getSettings() });
}

const patchSchema = z
  .object({
    storeName: z.string().min(1),
    bankName: z.string(),
    bankAccountName: z.string(),
    bankAccountNumber: z.string(),
    whatsappNumber: z.string(),
    slotDaily: z.number().int().min(1),
    cycleDays: z.number().int().min(1),
    groupSlots: z.number().int().min(1),
    groupPriceCap: z.number().int().min(1),
  })
  .partial();

export async function PATCH(req: NextRequest) {
  const gate = await requireAdmin("settings");
  if ("response" in gate) return gate.response;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Invalid settings values.");

  await getSettings(); // ensure the row exists
  const settings = unwrap(
    await supabase.from("Settings").update(parsed.data).eq("id", "singleton").select("*").single(),
  );
  return NextResponse.json({ settings });
}
