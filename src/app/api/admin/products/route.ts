import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { supabase, unwrap } from "@/lib/supabase";
import { requireAdmin, jsonError } from "@/lib/auth/guards";
import { slugify, LOW_STOCK_THRESHOLD } from "@/lib/slug";
import { ilikePattern } from "@/lib/server/product-query";

// GET /api/admin/products?q=&categoryId=&brandId=&condition=new|used&lowStock=true&active=true
export async function GET(req: NextRequest) {
  const gate = await requireAdmin("products");
  if ("response" in gate) return gate.response;

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const condition = sp.get("condition");

  let query = supabase
    .from("Product")
    .select("*, category:Category(name,slug), brand:Brand(name,slug)", { count: "exact" });
  if (q) query = query.ilike("name", ilikePattern(q));
  if (sp.get("categoryId")) query = query.eq("categoryId", sp.get("categoryId"));
  if (sp.get("brandId")) query = query.eq("brandId", sp.get("brandId"));
  if (condition === "new" || condition === "used") query = query.eq("condition", condition);
  if (sp.get("lowStock") === "true") query = query.lt("stockQuantity", LOW_STOCK_THRESHOLD);
  if (sp.get("active") === "true") query = query.eq("active", true);
  if (sp.get("active") === "false") query = query.eq("active", false);

  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(Math.max(1, Number(sp.get("pageSize")) || 20), 100);

  query = query.order("createdAt", { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);
  const res = await query;
  if (res.error) return jsonError(500, res.error.message);
  const total = res.count ?? 0;
  return NextResponse.json({ products: res.data, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) });
}

const createSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().int().min(0),
  deliveryFee: z.number().int().min(0).default(0),
  stockQuantity: z.number().int().min(0).default(0),
  condition: z.enum(["new", "used"]).default("new"),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  images: z.array(z.string()).default([]),
  specs: z.record(z.string(), z.string()).optional(),
  active: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const gate = await requireAdmin("products");
  if ("response" in gate) return gate.response;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Invalid product details.");
  const data = parsed.data;

  const base = slugify(data.name);
  let slug = base;
  for (let n = 2; ; n++) {
    const { data: clash } = await supabase.from("Product").select("id").eq("slug", slug).maybeSingle();
    if (!clash) break;
    slug = `${base}-${n}`;
  }

  const product = unwrap(
    await supabase
      .from("Product")
      .insert({
        name: data.name,
        slug,
        description: data.description ?? null,
        price: data.price,
        deliveryFee: data.deliveryFee,
        stockQuantity: data.stockQuantity,
        condition: data.condition,
        categoryId: data.categoryId ?? null,
        brandId: data.brandId ?? null,
        images: data.images,
        specs: data.specs ?? null,
        active: data.active,
      })
      .select("*")
      .single(),
  );
  return NextResponse.json({ product }, { status: 201 });
}
