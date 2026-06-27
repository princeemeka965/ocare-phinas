import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { supabase, unwrap } from "@/lib/supabase";
import { requireAdmin, jsonError } from "@/lib/auth/guards";
import { slugify } from "@/lib/slug";
import { buildCategoryIcon } from "@/lib/server/category-icon";

export async function GET() {
  const gate = await requireAdmin("categories");
  if ("response" in gate) return gate.response;

  const res = await supabase
    .from("Category")
    .select("*, products:Product(count)")
    .order("name", { ascending: true });
  if (res.error) {
    console.error("[admin/categories GET] supabase error:", res.error);
    return jsonError(500, process.env.NODE_ENV !== "production" ? res.error.message : "Could not load categories.");
  }
  const rows = res.data as (Record<string, unknown> & { products: { count: number }[] })[];
  const categories = rows.map(({ products, ...c }) => ({ ...c, _count: { products: products[0]?.count ?? 0 } }));
  return NextResponse.json({ categories });
}

const schema = z.object({
  name: z.string().min(2),
  /** Original Cloudinary upload URL; the server removes the background + traces an icon. */
  image: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  const gate = await requireAdmin("categories");
  if ("response" in gate) return gate.response;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "A category name is required.");

  const base = slugify(parsed.data.name);
  let slug = base;
  for (let n = 2; ; n++) {
    const { data: clash } = await supabase.from("Category").select("id").eq("slug", slug).maybeSingle();
    if (!clash) break;
    slug = `${base}-${n}`;
  }

  const icon = parsed.data.image ? await buildCategoryIcon(parsed.data.image) : null;

  const category = unwrap(
    await supabase
      .from("Category")
      .insert({ name: parsed.data.name, slug, image: icon?.image ?? null, iconSvg: icon?.iconSvg ?? null })
      .select("*")
      .single(),
  );
  return NextResponse.json(
    { category, backgroundRemovalFailed: icon?.backgroundRemovalFailed ?? false },
    { status: 201 },
  );
}
