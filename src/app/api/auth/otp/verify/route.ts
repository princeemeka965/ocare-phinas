import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/auth/password";
import { jsonError } from "@/lib/auth/guards";

const schema = z.object({ phone: z.string().min(7), code: z.string().length(6) });

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Phone and a 6-digit code are required.");
  const { phone, code } = parsed.data;

  const otp = await prisma.otpCode.findFirst({
    where: { phone, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp || otp.attempts >= MAX_ATTEMPTS) return jsonError(400, "Code expired or invalid. Request a new one.");

  if (!(await verifyOtp(code, otp.codeHash))) {
    await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return jsonError(400, "Incorrect code.");
  }

  await prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
  // Mark the matching customer's phone verified, if one exists.
  await prisma.customer.updateMany({ where: { phone }, data: { phoneVerified: true } });

  return NextResponse.json({ ok: true });
}
