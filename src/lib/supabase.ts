import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/* ------------------------------------------------------------------ *
 * Supabase server client — the single data access point for the app. *
 * ------------------------------------------------------------------ *
 * We use the service-role key, so this client MUST only ever be       *
 * imported from server code (API routes, server components, scripts). *
 * It bypasses Row Level Security; the app enforces access in          *
 * src/lib/auth/guards.ts, never RLS. Supabase is used purely as the   *
 * database — auth stays custom (jose JWT + bcrypt).                   *
 *                                                                     *
 * Connection details come from .env:                                  *
 *   NEXT_PUBLIC_SUPABASE_URL                                          *
 *   SUPABASE_SERVICE_ROLE_KEY                                         *
 * ------------------------------------------------------------------ */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env",
  );
}

/* Reuse a single client across hot reloads in dev (avoids leaking connections). */
const globalForSupabase = globalThis as unknown as { supabase?: SupabaseClient };

export const supabase: SupabaseClient =
  globalForSupabase.supabase ??
  createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

if (process.env.NODE_ENV !== "production") globalForSupabase.supabase = supabase;

/** Throw on a Supabase error, returning the (non-null) data. Keeps call sites terse. */
export function unwrap<T>(res: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (res.error) throw new Error(res.error.message);
  return res.data as NonNullable<T>;
}
