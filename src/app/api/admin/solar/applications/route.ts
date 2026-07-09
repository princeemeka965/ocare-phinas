import { NextResponse } from "next/server";

import { supabase, unwrap } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth/guards";

// GET /api/admin/solar/applications — every application, joined with customer + package
// summary. Client-side tabs filter by status (matches today's built UX/scale).
export async function GET() {
  const gate = await requireAdmin("solar");
  if ("response" in gate) return gate.response;

  const applications = unwrap(
    await supabase
      .from("SolarApplication")
      .select("*, customer:Customer(id,name,email,phone), package:SolarPackage(name,totalAmount)")
      .order("createdAt", { ascending: false }),
  );

  return NextResponse.json({ applications });
}
