import { NextRequest, NextResponse } from "next/server";

/*
 * API access guard — blocks direct browser navigation to /api/* endpoints.
 *
 * Authentication (the session cookie) proves *who* you are, but the browser
 * attaches that cookie to any request — including pasting an API URL into the
 * address bar. To distinguish a real in-app fetch from a manual navigation we
 * require the `x-requested-by` header that src/lib/api.ts sets on every call.
 * The address bar and cross-site JavaScript cannot set custom headers, so any
 * request to /api/* without it is rejected with 403.
 *
 * Exemptions:
 *   - /api/cron/*  — server-to-server, authenticated via the CRON_SECRET header.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Cron endpoints carry their own secret; let them through to their handler.
  if (pathname.startsWith("/api/cron/")) return NextResponse.next();

  if (req.headers.get("x-requested-by") !== "ocare-web") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
