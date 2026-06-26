import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { supabase, unwrap } from "@/lib/supabase";
import { requireAdmin, jsonError } from "@/lib/auth/guards";
import { ASSIGNABLE_PERMISSIONS, type AdminPermission } from "@/lib/admin-access";
import type { AdminUser, AdminPermissionGrant } from "@/lib/db/types";

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

  const { data: target } = await supabase.from("AdminUser").select("id,role").eq("id", id).maybeSingle<{ id: string; role: string }>();
  if (!target || target.role !== "sub") return jsonError(404, "Sub-admin not found.");

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Invalid update.");
  const { name, disabled, permissions } = parsed.data;

  if (permissions) {
    const perms = cleanPerms(permissions);
    if (!perms) return jsonError(400, "Invalid permission — \"team\" can't be granted to a sub-admin.");
    // Replace the grant set (delete-then-insert; the unique constraint dedupes).
    await supabase.from("AdminPermissionGrant").delete().eq("adminUserId", id);
    await supabase.from("AdminPermissionGrant").insert(perms.map((permission) => ({ adminUserId: id, permission })));
  }

  const admin = unwrap(
    await supabase
      .from("AdminUser")
      .update({ ...(name !== undefined ? { name } : {}), ...(disabled !== undefined ? { disabled } : {}) })
      .eq("id", id)
      .select("*, permissions:AdminPermissionGrant(permission)")
      .single(),
  ) as AdminUser & { permissions: Pick<AdminPermissionGrant, "permission">[] };
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

  const { data: target } = await supabase.from("AdminUser").select("id,role").eq("id", id).maybeSingle<{ id: string; role: string }>();
  if (!target || target.role !== "sub") return jsonError(404, "Sub-admin not found.");

  await supabase.from("AdminUser").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
