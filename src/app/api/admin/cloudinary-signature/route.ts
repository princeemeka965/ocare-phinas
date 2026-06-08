import { createHash } from "crypto";
import { NextResponse } from "next/server";

import { requireAdmin, jsonError } from "@/lib/auth/guards";

/**
 * POST /api/admin/cloudinary-signature — issue a short-lived signature so the
 * admin's browser can upload a product image directly to Cloudinary without ever
 * exposing the API secret. Signed uploads (vs. an unsigned preset) keep the
 * endpoint admin-only. See product-form.tsx for the matching upload call.
 */
export async function POST() {
  const gate = await requireAdmin("products");
  if ("response" in gate) return gate.response;

  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!apiKey || !apiSecret || !cloudName) {
    return jsonError(500, "Image uploads are not configured.");
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = "ocare-phinas/products";

  // Cloudinary signature: the signed params sorted by key as `k=v&k=v`, with the
  // API secret appended, hashed with SHA-1. Only sign what the client also sends.
  const toSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = createHash("sha1").update(toSign + apiSecret).digest("hex");

  return NextResponse.json({ cloudName, apiKey, timestamp, folder, signature });
}
