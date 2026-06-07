import { NextResponse } from "next/server";

import { clearedCookie, CUSTOMER_COOKIE } from "@/lib/auth/session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(clearedCookie(CUSTOMER_COOKIE));
  return res;
}
