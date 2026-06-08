import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

// GET /api/search/suggest?q=
// Powers the header search dropdown: a few matching products plus the
// categories and brands whose names match, so search reaches beyond product
// names into category and brand navigation.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ products: [], categories: [], brands: [] });
  }

  const contains = { contains: q, mode: "insensitive" } as const;
  const productWhere: Prisma.ProductWhereInput = {
    active: true,
    OR: [
      { name: contains },
      { brand: { is: { name: contains } } },
      { category: { is: { name: contains } } },
    ],
  };

  const [products, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where: productWhere,
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, name: true, slug: true, price: true, images: true },
    }),
    prisma.category.findMany({
      where: { name: contains },
      orderBy: { name: "asc" },
      take: 4,
      select: { id: true, name: true, slug: true },
    }),
    prisma.brand.findMany({
      where: { name: contains },
      orderBy: { name: "asc" },
      take: 4,
      select: { id: true, name: true, slug: true },
    }),
  ]);

  return NextResponse.json({ products, categories, brands });
}
