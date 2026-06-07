import { NextResponse } from "next/server";

import { clearedCookie, ADMIN_COOKIE } from "@/lib/auth/session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(clearedCookie(ADMIN_COOKIE));
  return res;
}
