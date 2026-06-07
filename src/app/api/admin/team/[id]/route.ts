import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdmin, jsonError } from "@/lib/auth/guards";
import { ASSIGNABLE_PERMISSIONS, type AdminPermission } from "@/lib/admin-access";

type Params = { params: Promise<{ id: string }> };

const ASSIGNABLE = new Set<string>(ASSIGNABLE_PERMISSIONS);

function cleanPerms(perms: string[]): AdminPermission[] | null {
  if (perms.some((p) => !ASSIGNABLE.has(p))) return null;
  return [...new Set(perms)] as AdminPermission[];
}

const patchSchema = z
  .object({
    name: z.string().min(2),
    disabled: z.boolean(),
    permissions: z.array(z.string()),
  })
  .partial();

// PATCH /api/admin/team/:id — update a sub-admin's name / permissions / disabled (super only).
export async function PATCH(req: NextRequest, { params }: Params) {
  const gate = await requireAdmin("team");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (!target || target.role !== "sub") return jsonError(404, "Sub-admin not found.");

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Invalid update.");
  const { name, disabled, permissions } = parsed.data;

  if (permissions) {
    const perms = cleanPerms(permissions);
    if (!perms) return jsonError(400, "Invalid permission — \"team\" can't be granted to a sub-admin.");
    await prisma.$transaction([
      prisma.adminPermissionGrant.deleteMany({ where: { adminUserId: id } }),
      prisma.adminPermissionGrant.createMany({ data: perms.map((permission) => ({ adminUserId: id, permission })) }),
    ]);
  }

  const admin = await prisma.adminUser.update({
    where: { id },
    data: { ...(name !== undefined ? { name } : {}), ...(disabled !== undefined ? { disabled } : {}) },
    include: { permissions: true },
  });
  return NextResponse.json({
    subAdmin: {
      id: admin.id, name: admin.name, email: admin.email, disabled: admin.disabled,
      permissions: admin.permissions.map((p) => p.permission),
    },
  });
}

// DELETE /api/admin/team/:id — remove a sub-admin (super only). Their confirmed
// payments keep the record but lose the admin link (confirmedById → null).
export async function DELETE(_req: NextRequest, { params }: Params) {
  const gate = await requireAdmin("team");
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (!target || target.role !== "sub") return jsonError(404, "Sub-admin not found.");

  await prisma.adminUser.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
