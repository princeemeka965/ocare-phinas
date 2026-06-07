import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { signSession, sessionCookie, CUSTOMER_COOKIE } from "@/lib/auth/session";
import { publicCustomer } from "@/lib/auth/serialize";
import { jsonError } from "@/lib/auth/guards";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Invalid registration details.");
  const { name, email, phone, password } = parsed.data;

  // Block list is keyed on phone + email (survives re-registration — spec B9).
  const existing = await prisma.customer.findFirst({ where: { OR: [{ email }, { phone }] } });
  if (existing) {
    if (existing.blocked) return jsonError(403, "This account is suspended — contact support.");
    return jsonError(409, "An account with this email or phone already exists.");
  }

  const customer = await prisma.customer.create({
    data: { name, email, phone, passwordHash: await hashPassword(password), wallet: { create: {} } },
  });

  const token = await signSession({ sub: customer.id, kind: "customer" });
  const res = NextResponse.json({ customer: publicCustomer(customer) }, { status: 201 });
  res.cookies.set(sessionCookie(CUSTOMER_COOKIE, token));
  return res;
}
