import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { signSession, sessionCookie, CUSTOMER_COOKIE } from "@/lib/auth/session";
import { publicCustomer } from "@/lib/auth/serialize";
import { jsonError } from "@/lib/auth/guards";

const schema = z.object({
  emailOrPhone: z.string().min(3),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Email/phone and password are required.");
  const { emailOrPhone, password } = parsed.data;

  const customer = await prisma.customer.findFirst({
    where: { OR: [{ email: emailOrPhone }, { phone: emailOrPhone }] },
  });
  // Same response whether the account is missing or the password is wrong.
  if (!customer || !(await verifyPassword(password, customer.passwordHash))) {
    return jsonError(401, "Invalid credentials.");
  }
  if (customer.blocked) return jsonError(403, "This account is suspended — contact support.");

  const token = await signSession({ sub: customer.id, kind: "customer" });
  const res = NextResponse.json({ customer: publicCustomer(customer) });
  res.cookies.set(sessionCookie(CUSTOMER_COOKIE, token));
  return res;
}
