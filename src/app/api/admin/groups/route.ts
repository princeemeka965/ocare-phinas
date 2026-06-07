import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdmin, jsonError } from "@/lib/auth/guards";
import { getSettings } from "@/lib/settings";
import { nextGroupReference } from "@/lib/server/lifecycle";

export async function GET() {
  const gate = await requireAdmin("groups");
  if ("response" in gate) return gate.response;

  const groups = await prisma.group.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { memberships: true } } },
  });
  return NextResponse.json({ groups });
}

const schema = z.object({ name: z.string().min(2), totalSlots: z.number().int().min(1).optional() });

export async function POST(req: NextRequest) {
  const gate = await requireAdmin("groups");
  if ("response" in gate) return gate.response;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "A group name is required.");

  const settings = await getSettings();
  const group = await prisma.group.create({
    data: {
      reference: await nextGroupReference(),
      name: parsed.data.name,
      totalSlots: parsed.data.totalSlots ?? settings.groupSlots,
      cycleLengthDays: settings.cycleDays,
    },
  });
  return NextResponse.json({ group }, { status: 201 });
}
