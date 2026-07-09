import { NextResponse } from "next/server";

import { supabase, unwrap } from "@/lib/supabase";
import type { SolarPackage } from "@/lib/db/types";

// GET /api/solar/packages — active solar packages (public, no auth required).
export async function GET() {
  const packages = unwrap(
    await supabase.from("SolarPackage").select("*").eq("active", true).order("createdAt", { ascending: true }),
  ) as SolarPackage[];

  return NextResponse.json({ packages });
}
