import { NextResponse } from "next/server";

import { supabase, unwrap } from "@/lib/supabase";
import { requireCustomer } from "@/lib/auth/guards";

// GET /api/me/notifications — in-app notifications for the signed-in customer.
export async function GET() {
  const gate = await requireCustomer();
  if ("response" in gate) return gate.response;

  const notifications = unwrap(
    await supabase
      .from("Notification")
      .select("*")
      .eq("customerId", gate.customer.id)
      .eq("channel", "in_app")
      .order("createdAt", { ascending: false })
      .limit(50),
  );
  return NextResponse.json({ notifications });
}
