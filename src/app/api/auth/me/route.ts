import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { currentCustomer, requireCustomer, jsonError } from "@/lib/auth/guards";
import { publicCustomer } from "@/lib/auth/serialize";

export async function GET() {
  const customer = await currentCustomer();
  if (!customer) return NextResponse.json({ customer: null });
  return NextResponse.json({ customer: publicCustomer(customer) });
}

const patchSchema = z
  .object({ name: z.string().min(2), email: z.string().email(), phone: z.string().min(7) })
  .partial();

export async function PATCH(req: NextRequest) {
  const gate = await requireCustomer();
  if ("response" in gate) return gate.response;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Invalid profile details.");
  const { name, email, phone } = parsed.data;

  // Guard uniqueness when email/phone change.
  if (email && email !== gate.customer.email) {
    if (await prisma.customer.findFirst({ where: { email, NOT: { id: gate.customer.id } } })) {
      return jsonError(409, "That email is already in use.");
    }
  }
  if (phone && phone !== gate.customer.phone) {
    if (await prisma.customer.findFirst({ where: { phone, NOT: { id: gate.customer.id } } })) {
      return jsonError(409, "That phone number is already in use.");
    }
  }

  const phoneChanged = phone !== undefined && phone !== gate.customer.phone;
  const customer = await prisma.customer.update({
    where: { id: gate.customer.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(phoneChanged ? { phoneVerified: false } : {}), // re-verify on phone change
    },
  });
  return NextResponse.json({ customer: publicCustomer(customer) });
}
