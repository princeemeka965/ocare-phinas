import { NextRequest, NextResponse } from "next/server";

import { supabase, unwrap } from "@/lib/supabase";
import { ilikePattern, nameOrClause } from "@/lib/server/product-query";

// GET /api/search/suggest?q=
// Powers the header search dropdown: a few matching products plus the
// categories and brands whose names match, so search reaches beyond product
// names into category and brand navigation.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ products: [], categories: [], brands: [] });
  }

  const pattern = ilikePattern(q);
  const [products, categories, brands] = await Promise.all([
    supabase
      .from("ProductCard")
      .select("id,name,slug,price,images")
      .eq("active", true)
      .or(nameOrClause(q))
      .order("createdAt", { ascending: false })
      .limit(6),
    supabase
      .from("Category")
      .select("id,name,slug")
      .ilike("name", pattern)
      .order("name", { ascending: true })
      .limit(4),
    supabase
      .from("Brand")
      .select("id,name,slug")
      .ilike("name", pattern)
      .order("name", { ascending: true })
      .limit(4),
  ]);

  return NextResponse.json({
    products: unwrap(products),
    categories: unwrap(categories),
    brands: unwrap(brands),
  });
}
