import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { requireAdmin, jsonError } from "@/lib/auth/guards";
import { ASSIGNABLE_PERMISSIONS, type AdminPermission } from "@/lib/admin-access";

const ASSIGNABLE = new Set<string>(ASSIGNABLE_PERMISSIONS);

/** Validate a permission list: must be assignable areas (never "team"), de-duplicated. */
function cleanPerms(perms: string[]): AdminPermission[] | null {
  if (perms.some((p) => !ASSIGNABLE.has(p))) return null;
  return [...new Set(perms)] as AdminPermission[];
}

function shape(admin: { id: string; name: string; email: string; createdAt: Date; disabled: boolean; permissions: { permission: string }[] }) {
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    createdAt: admin.createdAt,
    disabled: admin.disabled,
    permissions: admin.permissions.map((p) => p.permission),
  };
}

// GET /api/admin/team — list sub-admins (super only).
export async function GET() {
  const gate = await requireAdmin("team");
  if ("response" in gate) return gate.response;

  const subs = await prisma.adminUser.findMany({
    where: { role: "sub" },
    include: { permissions: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ subAdmins: subs.map(shape) });
}

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  permissions: z.array(z.string()).min(1),
});

// POST /api/admin/team — create a sub-admin with credentials + granted areas (super only).
export async function POST(req: NextRequest) {
  const gate = await requireAdmin("team");
  if ("response" in gate) return gate.response;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Name, email, an 8+ char password and at least one area are required.");
  const perms = cleanPerms(parsed.data.permissions);
  if (!perms) return jsonError(400, "Invalid permission — \"team\" can't be granted to a sub-admin.");

  if (await prisma.adminUser.findUnique({ where: { email: parsed.data.email } })) {
    return jsonError(409, "An admin with this email already exists.");
  }

  const admin = await prisma.adminUser.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      role: "sub",
      mustChangePassword: true,
      createdById: gate.admin.id,
      permissions: { create: perms.map((permission) => ({ permission })) },
    },
    include: { permissions: true },
  });
  return NextResponse.json({ subAdmin: shape(admin) }, { status: 201 });
}
