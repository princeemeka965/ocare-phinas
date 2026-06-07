import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { requireAdmin, jsonError } from "@/lib/auth/guards";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

// Available to ANY signed-in admin — no area permission required (payment-flow §15.4).
export async function PATCH(req: NextRequest) {
  const gate = await requireAdmin();
  if ("response" in gate) return gate.response;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Current password and a new password (8+ chars) are required.");
  const { currentPassword, newPassword } = parsed.data;

  const admin = await prisma.adminUser.findUnique({ where: { id: gate.admin.id } });
  if (!admin || !(await verifyPassword(currentPassword, admin.passwordHash))) {
    return jsonError(400, "Your current password is incorrect.");
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { passwordHash: await hashPassword(newPassword), mustChangePassword: false },
  });
  return NextResponse.json({ ok: true });
}
