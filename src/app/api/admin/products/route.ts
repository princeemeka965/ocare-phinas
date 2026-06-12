import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdmin, jsonError } from "@/lib/auth/guards";
import { slugify, LOW_STOCK_THRESHOLD } from "@/lib/slug";

// GET /api/admin/products?q=&categoryId=&brandId=&condition=new|used&lowStock=true&active=true
export async function GET(req: NextRequest) {
  const gate = await requireAdmin("products");
  if ("response" in gate) return gate.response;

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const condition = sp.get("condition");
  const where: Record<string, unknown> = {};
  if (q) where.name = { contains: q, mode: "insensitive" };
  if (sp.get("categoryId")) where.categoryId = sp.get("categoryId");
  if (sp.get("brandId")) where.brandId = sp.get("brandId");
  if (condition === "new" || condition === "used") where.condition = condition;
  if (sp.get("lowStock") === "true") where.stockQuantity = { lt: LOW_STOCK_THRESHOLD };
  if (sp.get("active") === "true") where.active = true;
  if (sp.get("active") === "false") where.active = false;

  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(Math.max(1, Number(sp.get("pageSize")) || 20), 100);
  const include = { category: { select: { name: true, slug: true } }, brand: { select: { name: true, slug: true } } };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);
  return NextResponse.json({ products, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) });
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

  let slug = slugify(data.name);
  for (let n = 2; await prisma.product.findUnique({ where: { slug } }); n++) slug = `${slugify(data.name)}-${n}`;

  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      price: data.price,
      deliveryFee: data.deliveryFee,
      stockQuantity: data.stockQuantity,
      condition: data.condition,
      categoryId: data.categoryId,
      brandId: data.brandId,
      images: data.images,
      specs: data.specs ?? undefined,
      active: data.active,
    },
  });
  return NextResponse.json({ product }, { status: 201 });
}
