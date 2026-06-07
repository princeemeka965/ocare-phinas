import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { signSession, sessionCookie, ADMIN_COOKIE } from "@/lib/auth/session";
import { jsonError } from "@/lib/auth/guards";
import type { AdminPermission } from "@/lib/admin-access";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Email and password are required.");
  const { email, password } = parsed.data;

  const admin = await prisma.adminUser.findUnique({ where: { email }, include: { permissions: true } });
  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    return jsonError(401, "Invalid credentials.");
  }
  if (admin.disabled) return jsonError(403, "This admin account is disabled.");

  const token = await signSession({ sub: admin.id, kind: "admin" });
  const res = NextResponse.json({
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions.map((p) => p.permission as AdminPermission),
      mustChangePassword: admin.mustChangePassword,
    },
  });
  res.cookies.set(sessionCookie(ADMIN_COOKIE, token));
  return res;
}
