import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { requireAdmin, jsonError } from "@/lib/auth/guards";

/**
 * POST /api/admin/cloudinary-signature — issue a short-lived signature so the
 * admin's browser can upload an image directly to Cloudinary without ever
 * exposing the API secret. Signed uploads (vs. an unsigned preset) keep the
 * endpoint admin-only. See product-form.tsx / catalog-manager.tsx for the
 * matching upload calls.
 *
 * Body: `{ folder?: "products" | "categories" | "brands" }` (defaults to
 * "products"). The caller must hold the matching admin permission for that area.
 */
const FOLDERS = {
  products: { permission: "products", path: "ocare-phinas/products" },
  categories: { permission: "categories", path: "ocare-phinas/categories" },
  // Brands are managed alongside categories, so they share that permission.
  brands: { permission: "categories", path: "ocare-phinas/brands" },
} as const;

type FolderKey = keyof typeof FOLDERS;

function folderKey(value: unknown): FolderKey {
  return value === "categories" || value === "brands" ? value : "products";
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { folder?: string };
  const key = folderKey(body.folder);
  const { permission, path: folder } = FOLDERS[key];

  const gate = await requireAdmin(permission);
  if ("response" in gate) return gate.response;

  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!apiKey || !apiSecret || !cloudName) {
    return jsonError(500, "Image uploads are not configured.");
  }

  const timestamp = Math.round(Date.now() / 1000);

  // Cloudinary signature: the signed params sorted by key as `k=v&k=v`, with the
  // API secret appended, hashed with SHA-1. Only sign what the client also sends.
  const toSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = createHash("sha1").update(toSign + apiSecret).digest("hex");

  return NextResponse.json({ cloudName, apiKey, timestamp, folder, signature });
}
