import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, jsonError } from "@/lib/auth/guards";

type Params = { params: Promise<{ id: string }> };

// POST /api/admin/groups/:id/close — close a group to new members.
export async function POST(_req: NextRequest, { params }: Params) {
  const gate = await requireAdmin("groups");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const group = await prisma.group.findUnique({ where: { id } });
  if (!group) return jsonError(404, "Group not found.");

  const updated = await prisma.group.update({ where: { id }, data: { status: "closed" } });
  return NextResponse.json({ group: updated });
}
