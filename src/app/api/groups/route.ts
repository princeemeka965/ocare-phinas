import { NextResponse } from "next/server";

import { supabase, unwrap } from "@/lib/supabase";

// Public — open groups a customer can join.
export async function GET() {
  const groups = unwrap(
    await supabase
      .from("Group")
      .select("id,reference,name,totalSlots,slotsFilled,cycleLengthDays")
      .eq("status", "open")
      .order("createdAt", { ascending: false }),
  ) as { id: string; reference: string; name: string; totalSlots: number; slotsFilled: number; cycleLengthDays: number }[];
  return NextResponse.json({
    groups: groups.map((g) => ({ ...g, slotsAvailable: g.totalSlots - g.slotsFilled })),
  });
}
