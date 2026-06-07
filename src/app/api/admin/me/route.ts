import { NextResponse } from "next/server";

import { currentAdmin } from "@/lib/auth/guards";

export async function GET() {
  const admin = await currentAdmin();
  return NextResponse.json({ admin });
}
