import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

// Public catalog listing.
// GET /api/products?q=&category=<slug>&brand=<slug>&condition=new|used&sort=&page=&pageSize=&limit=
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  const where: Prisma.ProductWhereInput = { active: true };
  const q = sp.get("q")?.trim();
  if (q) {
    /* Match the product name, its brand, or its category. */
    const contains = { contains: q, mode: "insensitive" } as const;
    where.OR = [
      { name: contains },
      { brand: { is: { name: contains } } },
      { category: { is: { name: contains } } },
    ];
  }
  const category = sp.get("category");
  if (category) where.category = { slug: category };
  const brand = sp.get("brand");
  if (brand) where.brand = { slug: brand };
  const condition = sp.get("condition");
  if (condition === "new" || condition === "used") where.condition = condition;

  const sort = sp.get("sort");
  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "price_asc" ? { price: "asc" } : sort === "price_desc" ? { price: "desc" } : { createdAt: "desc" };

  const include = {
    category: { select: { name: true, slug: true } },
    brand: { select: { name: true, slug: true } },
  } satisfies Prisma.ProductInclude;

  // `limit` = simple cap (e.g. homepage rows); otherwise paginate.
  const limit = sp.get("limit");
  if (limit) {
    const products = await prisma.product.findMany({ where, orderBy, include, take: Math.min(Number(limit) || 12, 60) });
    return NextResponse.json({ products });
  }

  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(Math.max(1, Number(sp.get("pageSize")) || 24), 60);
  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy, include, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.product.count({ where }),
  ]);
  return NextResponse.json({ products, total, page, pageSize, pages: Math.ceil(total / pageSize) });
}
