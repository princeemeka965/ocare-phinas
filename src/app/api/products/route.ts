import { NextRequest, NextResponse } from "next/server";

import { supabase } from "@/lib/supabase";
import { nameOrClause, reshapeProduct, type ProductCardRow } from "@/lib/server/product-query";

// Public catalog listing.
// GET /api/products?q=&category=<slug>&brand=<slug>&condition=new|used&sort=&page=&pageSize=&limit=
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  // The flattened view lets us filter by category/brand slug and free-text
  // match across product/brand/category names in one query.
  const wantCount = !sp.get("limit");
  let query = supabase
    .from("ProductCard")
    .select("*", wantCount ? { count: "exact" } : undefined)
    .eq("active", true);

  const q = sp.get("q")?.trim();
  if (q) query = query.or(nameOrClause(q));
  const category = sp.get("category");
  if (category) query = query.eq("categorySlug", category);
  const brand = sp.get("brand");
  if (brand) query = query.eq("brandSlug", brand);
  const condition = sp.get("condition");
  if (condition === "new" || condition === "used") query = query.eq("condition", condition);

  const sort = sp.get("sort");
  query =
    sort === "price_asc"
      ? query.order("price", { ascending: true })
      : sort === "price_desc"
        ? query.order("price", { ascending: false })
        : query.order("createdAt", { ascending: false });

  // `limit` = simple cap (e.g. homepage rows); otherwise paginate.
  const limit = sp.get("limit");
  if (limit) {
    query = query.limit(Math.min(Number(limit) || 12, 60));
    const res = await query;
    if (res.error) return NextResponse.json({ error: res.error.message }, { status: 500 });
    return NextResponse.json({ products: (res.data as ProductCardRow[]).map(reshapeProduct) });
  }

  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(Math.max(1, Number(sp.get("pageSize")) || 24), 60);
  query = query.range((page - 1) * pageSize, page * pageSize - 1);
  const res = await query;
  if (res.error) return NextResponse.json({ error: res.error.message }, { status: 500 });
  const total = res.count ?? 0;
  return NextResponse.json({
    products: (res.data as ProductCardRow[]).map(reshapeProduct),
    total,
    page,
    pageSize,
    pages: Math.ceil(total / pageSize),
  });
}
