import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { naira } from "@/lib/pay-small-small";
import { plansInArrears } from "@/lib/server/arrears";

/**
 * POST /api/cron/recompute-arrears — run daily (a plan tips into missed/overdue
 * with the passage of time, no event fires; payment-flow §13.6). Sends one
 * in-app + SMS reminder per plan per day on its current arrears state.
 * Protect with the CRON_SECRET header (e.g. a Vercel Cron / scheduler).
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const rows = await plansInArrears();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  let notified = 0;
  for (const { plan, health } of rows) {
    const type = health.status === "overdue" ? "payment_overdue" : "payment_missed";
    const already = await prisma.notification.count({
      where: { customerId: plan.customerId, planId: plan.id, type, createdAt: { gte: startOfDay } },
    });
    if (already > 0) continue;

    const product = plan.product?.name ?? "your plan";
    const body =
      health.status === "overdue"
        ? `OCare Phinas: ${naira(health.arrears)} on ${product} is overdue. Please clear it to keep your account in good standing.`
        : `OCare Phinas: you're ${naira(health.arrears)} behind on ${product}. Catch up to stay on track.`;

    await prisma.notification.createMany({
      data: [
        { customerId: plan.customerId, planId: plan.id, type, channel: "in_app", body },
        { customerId: plan.customerId, planId: plan.id, type, channel: "sms", body },
      ],
    });
    notified++;
  }

  return NextResponse.json({ scanned: rows.length, notified });
}
