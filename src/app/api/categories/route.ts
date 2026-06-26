import { NextResponse } from "next/server";

import { supabase, unwrap } from "@/lib/supabase";

// Public — categories for the storefront nav / filters.
export async function GET() {
  const categories = unwrap(
    await supabase.from("Category").select("id,name,slug,image,iconSvg").order("name", { ascending: true }),
  );
  return NextResponse.json({ categories });
}
