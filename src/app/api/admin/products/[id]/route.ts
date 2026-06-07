import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdmin, jsonError } from "@/lib/auth/guards";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const gate = await requireAdmin("products");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: { select: { id: true, name: true, slug: true } }, brand: { select: { id: true, name: true, slug: true } } },
  });
  if (!product) return jsonError(404, "Product not found.");
  return NextResponse.json({ product });
}

const patchSchema = z
  .object({
    name: z.string().min(2),
    description: z.string().nullable(),
    price: z.number().int().min(0),
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

  const exists = await prisma.product.findUnique({ where: { id } });
  if (!exists) return jsonError(404, "Product not found.");

  const { specs, ...rest } = parsed.data;
  const product = await prisma.product.update({
    where: { id },
    data: { ...rest, ...(specs !== undefined ? { specs: specs ?? undefined } : {}) },
  });
  return NextResponse.json({ product });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const gate = await requireAdmin("products");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  // A product tied to plans or past orders can't be hard-deleted — deactivate it.
  const [plans, orderItems] = await Promise.all([
    prisma.plan.count({ where: { productId: id } }),
    prisma.orderItem.count({ where: { productId: id } }),
  ]);
  if (plans > 0 || orderItems > 0) {
    return jsonError(409, "This product is referenced by orders or plans. Deactivate it instead of deleting.");
  }

  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
