import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdmin, jsonError } from "@/lib/auth/guards";
import { slugify } from "@/lib/slug";

export async function GET() {
  const gate = await requireAdmin("categories");
  if ("response" in gate) return gate.response;

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json({ categories });
}

const schema = z.object({ name: z.string().min(2) });

export async function POST(req: NextRequest) {
  const gate = await requireAdmin("categories");
  if ("response" in gate) return gate.response;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "A category name is required.");

  let slug = slugify(parsed.data.name);
  for (let n = 2; await prisma.category.findUnique({ where: { slug } }); n++) slug = `${slugify(parsed.data.name)}-${n}`;

  const category = await prisma.category.create({ data: { name: parsed.data.name, slug } });
  return NextResponse.json({ category }, { status: 201 });
}
