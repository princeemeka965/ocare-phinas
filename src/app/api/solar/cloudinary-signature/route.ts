import { createHash } from "crypto";
import { NextResponse } from "next/server";

import { requireCustomer, jsonError } from "@/lib/auth/guards";

/**
 * POST /api/solar/cloudinary-signature — issue a short-lived signature so a
 * customer's browser can upload their solar KYC documents (ID + utility
 * bill) directly to Cloudinary. Same signed-upload pattern as
 * /api/admin/cloudinary-signature, but customer-gated and fixed to a single
 * folder (customers never choose where their KYC docs land).
 */
const FOLDER = "ocare-phinas/solar-kyc";

export async function POST() {
  const gate = await requireCustomer();
  if ("response" in gate) return gate.response;

  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!apiKey || !apiSecret || !cloudName) {
    return jsonError(500, "Document uploads are not configured.");
  }

  const timestamp = Math.round(Date.now() / 1000);
  const toSign = `folder=${FOLDER}&timestamp=${timestamp}`;
  const signature = createHash("sha1").update(toSign + apiSecret).digest("hex");

  return NextResponse.json({ cloudName, apiKey, timestamp, folder: FOLDER, signature });
}
