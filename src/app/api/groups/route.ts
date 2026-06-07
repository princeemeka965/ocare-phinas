import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

// Public — open groups a customer can join.
export async function GET() {
  const groups = await prisma.group.findMany({
    where: { status: "open" },
    orderBy: { createdAt: "desc" },
    select: { id: true, reference: true, name: true, totalSlots: true, slotsFilled: true, cycleLengthDays: true },
  });
  return NextResponse.json({
    groups: groups.map((g) => ({ ...g, slotsAvailable: g.totalSlots - g.slotsFilled })),
  });
}
