import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdmin, jsonError } from "@/lib/auth/guards";
import { slugify } from "@/lib/slug";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({ name: z.string().min(2) });

export async function PATCH(req: NextRequest, { params }: Params) {
  const gate = await requireAdmin("categories");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "A category name is required.");

  const exists = await prisma.category.findUnique({ where: { id } });
  if (!exists) return jsonError(404, "Category not found.");

  const category = await prisma.category.update({
    where: { id },
    data: { name: parsed.data.name, slug: slugify(parsed.data.name) },
  });
  return NextResponse.json({ category });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const gate = await requireAdmin("categories");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const products = await prisma.product.count({ where: { categoryId: id } });
  if (products > 0) return jsonError(409, `This category has ${products} product(s). Reassign or remove them first.`);

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
