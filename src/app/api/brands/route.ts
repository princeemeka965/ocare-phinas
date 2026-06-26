import { NextResponse } from "next/server";

import { supabase, unwrap } from "@/lib/supabase";

// Public — brands for "Shop by Brand" pages and the brand filter.
export async function GET() {
  const brands = unwrap(
    await supabase.from("Brand").select("id,name,slug,logo").order("name", { ascending: true }),
  );
  return NextResponse.json({ brands });
}
