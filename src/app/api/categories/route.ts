import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

// Public — categories for the storefront nav / filters.
export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, image: true, iconSvg: true },
  });
  return NextResponse.json({ categories });
}
