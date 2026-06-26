import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { supabase, unwrap } from "@/lib/supabase";
import { requireAdmin, jsonError } from "@/lib/auth/guards";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const gate = await requireAdmin("products");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const { data: product } = await supabase
    .from("Product")
    .select("*, category:Category(id,name,slug), brand:Brand(id,name,slug)")
    .eq("id", id)
    .maybeSingle();
  if (!product) return jsonError(404, "Product not found.");
  return NextResponse.json({ product });
}

const patchSchema = z
  .object({
    name: z.string().min(2),
    description: z.string().nullable(),
    price: z.number().int().min(0),
    deliveryFee: z.number().int().min(0),
    stockQuantity: z.number().int().min(0),
    condition: z.enum(["new", "used"]),
    categoryId: z.string().nullable(),
    brandId: z.string().nullable(),
    images: z.array(z.string()),
    specs: z.record(z.string(), z.string()).nullable(),
    active: z.boolean(),
  })
  .partial();

export async function PATCH(req: NextRequest, { params }: Params) {
  const gate = await requireAdmin("products");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Invalid product details.");

  const { data: exists } = await supabase.from("Product").select("id").eq("id", id).maybeSingle();
  if (!exists) return jsonError(404, "Product not found.");

  const { specs, ...rest } = parsed.data;
  const product = unwrap(
    await supabase
      .from("Product")
      .update({ ...rest, ...(specs !== undefined ? { specs: specs ?? null } : {}) })
      .eq("id", id)
      .select("*")
      .single(),
  );
  return NextResponse.json({ product });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const gate = await requireAdmin("products");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  // A product tied to plans or past orders can't be hard-deleted — deactivate it.
  const [plans, orderItems] = await Promise.all([
    supabase.from("Plan").select("*", { count: "exact", head: true }).eq("productId", id),
    supabase.from("OrderItem").select("*", { count: "exact", head: true }).eq("productId", id),
  ]);
  if ((plans.count ?? 0) > 0 || (orderItems.count ?? 0) > 0) {
    return jsonError(409, "This product is referenced by orders or plans. Deactivate it instead of deleting.");
  }

  await supabase.from("Product").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
