import { supabase, unwrap } from "./supabase";
import type { Settings } from "./db/types";

/** The settings singleton, created with defaults on first access. */
export async function getSettings(): Promise<Settings> {
  const existing = await supabase.from("Settings").select("*").eq("id", "singleton").maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) return existing.data as Settings;
  // First access — create the singleton with DB defaults.
  return unwrap(
    await supabase.from("Settings").insert({ id: "singleton" }).select("*").single(),
  ) as Settings;
}

/** Fields safe to expose to the storefront (bank + WhatsApp are shown on payment screens). */
export function publicSettings(s: Settings) {
  const { id: _id, ...rest } = s;
  void _id;
  return rest;
}
