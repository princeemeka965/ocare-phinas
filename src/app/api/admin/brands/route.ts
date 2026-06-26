import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { supabase, unwrap } from "@/lib/supabase";
import { requireAdmin, jsonError } from "@/lib/auth/guards";
import { slugify } from "@/lib/slug";
import { backgroundRemovedImage } from "@/lib/server/category-icon";

export async function GET() {
  const gate = await requireAdmin("categories");
  if ("response" in gate) return gate.response;

  const rows = unwrap(
    await supabase.from("Brand").select("*, products:Product(count)").order("name", { ascending: true }),
  ) as (Record<string, unknown> & { products: { count: number }[] })[];
  const brands = rows.map(({ products, ...b }) => ({ ...b, _count: { products: products[0]?.count ?? 0 } }));
  return NextResponse.json({ brands });
}

const schema = z.object({
  name: z.string().min(2),
  /** Original Cloudinary upload URL; the server removes the background. */
  logo: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  const gate = await requireAdmin("categories");
  if ("response" in gate) return gate.response;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "A brand name is required.");

  const base = slugify(parsed.data.name);
  let slug = base;
  for (let n = 2; ; n++) {
    const { data: clash } = await supabase.from("Brand").select("id").eq("slug", slug).maybeSingle();
    if (!clash) break;
    slug = `${base}-${n}`;
  }

  const removed = parsed.data.logo ? await backgroundRemovedImage(parsed.data.logo) : null;

  const brand = unwrap(
    await supabase.from("Brand").insert({ name: parsed.data.name, slug, logo: removed?.image ?? null }).select("*").single(),
  );
  return NextResponse.json(
    { brand, backgroundRemovalFailed: removed?.backgroundRemovalFailed ?? false },
    { status: 201 },
  );
}
