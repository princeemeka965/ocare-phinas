import type { Settings } from "@prisma/client";

import { prisma } from "./prisma";

/** The settings singleton, created with defaults on first access. */
export async function getSettings(): Promise<Settings> {
  return prisma.settings.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } });
}

/** Fields safe to expose to the storefront (bank + WhatsApp are shown on payment screens). */
export function publicSettings(s: Settings) {
  const { id: _id, ...rest } = s;
  void _id;
  return rest;
}
