import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

// Public — brands for "Shop by Brand" pages and the brand filter.
export async function GET() {
  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, logo: true },
  });
  return NextResponse.json({ brands });
}
