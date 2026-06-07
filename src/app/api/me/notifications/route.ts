import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/auth/guards";

// GET /api/me/notifications — in-app notifications for the signed-in customer.
export async function GET() {
  const gate = await requireCustomer();
  if ("response" in gate) return gate.response;

  const notifications = await prisma.notification.findMany({
    where: { customerId: gate.customer.id, channel: "in_app" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ notifications });
}
