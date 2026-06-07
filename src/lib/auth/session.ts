import { SignJWT, jwtVerify } from "jose";

/* ------------------------------------------------------------------ *
 * Session tokens — stateless JWTs in httpOnly cookies.                 *
 * ------------------------------------------------------------------ *
 * Two separate cookies so a customer session and an admin session       *
 * never collide. Each request still loads the user and re-checks        *
 * blocked/disabled, so blocking effectively revokes access immediately. *
 * ------------------------------------------------------------------ */

export const CUSTOMER_COOKIE = "ocp_customer_session";
export const ADMIN_COOKIE = "ocp_admin_session";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type SessionKind = "customer" | "admin";

export interface SessionPayload {
  sub: string; // user id
  kind: SessionKind;
}

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(s);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ kind: payload.kind })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub || (payload.kind !== "customer" && payload.kind !== "admin")) return null;
    return { sub: payload.sub, kind: payload.kind as SessionKind };
  } catch {
    return null;
  }
}

/** Cookie options for setting a session on a NextResponse. */
export function sessionCookie(name: string, value: string) {
  return {
    name,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}

/** Cookie options to clear a session. */
export function clearedCookie(name: string) {
  return { name, value: "", httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 0 };
}
