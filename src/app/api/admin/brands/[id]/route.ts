import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
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

  const exists = await prisma.brand.findUnique({ where: { id } });
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

  const brand = await prisma.brand.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name, slug: slugify(name) } : {}),
      ...(logoUpdate !== undefined ? { logo: logoUpdate } : {}),
    },
  });
  return NextResponse.json({ brand, backgroundRemovalFailed });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const gate = await requireAdmin("categories");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const products = await prisma.product.count({ where: { brandId: id } });
  if (products > 0) return jsonError(409, `This brand has ${products} product(s). Reassign or remove them first.`);

  await prisma.brand.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
