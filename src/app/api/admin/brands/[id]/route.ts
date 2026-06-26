import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { supabase, unwrap } from "@/lib/supabase";
import { requireAdmin, jsonError } from "@/lib/auth/guards";
import { slugify } from "@/lib/slug";
import { backgroundRemovedImage } from "@/lib/server/category-icon";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({ name: z.string().min(2).optional(), logo: z.string().nullable().optional() });

export async function PATCH(req: NextRequest, { params }: Params) {
  const gate = await requireAdmin("categories");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Invalid brand details.");

  const { data: exists } = await supabase.from("Brand").select("id").eq("id", id).maybeSingle();
  if (!exists) return jsonError(404, "Brand not found.");

  const { name, logo } = parsed.data;

  // A non-null logo is a fresh upload URL — run background removal. `null` clears it.
  let logoUpdate: string | null | undefined;
  let backgroundRemovalFailed = false;
  if (logo === null) {
    logoUpdate = null;
  } else if (logo !== undefined) {
    const removed = await backgroundRemovedImage(logo);
    logoUpdate = removed.image;
    backgroundRemovalFailed = removed.backgroundRemovalFailed;
  }

  const brand = unwrap(
    await supabase
      .from("Brand")
      .update({
        ...(name !== undefined ? { name, slug: slugify(name) } : {}),
        ...(logoUpdate !== undefined ? { logo: logoUpdate } : {}),
      })
      .eq("id", id)
      .select("*")
      .single(),
  );
  return NextResponse.json({ brand, backgroundRemovalFailed });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const gate = await requireAdmin("categories");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const { count } = await supabase.from("Product").select("*", { count: "exact", head: true }).eq("brandId", id);
  const products = count ?? 0;
  if (products > 0) return jsonError(409, `This brand has ${products} product(s). Reassign or remove them first.`);

  await supabase.from("Brand").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
