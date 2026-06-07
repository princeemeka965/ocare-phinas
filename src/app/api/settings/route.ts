import { NextResponse } from "next/server";

import { getSettings, publicSettings } from "@/lib/settings";

// Public — the storefront payment screens need bank details + WhatsApp number.
export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({ settings: publicSettings(settings) });
}
