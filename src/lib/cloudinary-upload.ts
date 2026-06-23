import { api } from "@/lib/api";

interface CloudinarySignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

export type UploadFolder = "products" | "categories" | "brands";

/** Upload a single file straight to Cloudinary using a server-issued signature.
 *  `folder` picks the target (and the admin permission the signature is gated on). */
export async function uploadToCloudinary(file: File, folder: UploadFolder = "products"): Promise<string> {
  const sig = await api.post<CloudinarySignature>("/api/admin/cloudinary-signature", { folder });
  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", sig.apiKey);
  fd.append("timestamp", String(sig.timestamp));
  fd.append("folder", sig.folder);
  fd.append("signature", sig.signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
    method: "POST",
    body: fd,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.secure_url) {
    throw new Error(data?.error?.message ?? "Cloudinary upload failed.");
  }
  return data.secure_url as string;
}
