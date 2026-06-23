/* ------------------------------------------------------------------ *
 * Category icon pipeline — turns an uploaded photo into a transparent  *
 * image (Cloudinary background removal) and a monochrome silhouette    *
 * SVG that renders in the header strip like the curated Lucide icons.  *
 * ------------------------------------------------------------------ */

import sharp from "sharp";
import { trace, type PotraceOptions } from "potrace";

/**
 * Derive a background-removed (transparent PNG) delivery URL from a Cloudinary
 * upload URL by inserting the `e_background_removal` transformation. Requires
 * the "Cloudinary AI Background Removal" add-on on the account; if it's not
 * enabled the URL will error and callers fall back to the original (see
 * `buildCategoryIcon`). Returns null if the URL isn't a Cloudinary upload URL.
 */
export function backgroundRemovedUrl(secureUrl: string): string | null {
  const marker = "/upload/";
  const i = secureUrl.indexOf(marker);
  if (!i || i < 0 || !secureUrl.includes("res.cloudinary.com")) return null;
  const head = secureUrl.slice(0, i + marker.length);
  const tail = secureUrl.slice(i + marker.length).replace(/\.[a-z0-9]+$/i, ".png");
  return `${head}e_background_removal,f_png/${tail}`;
}

/** Fetch image bytes, retrying while Cloudinary is still processing the
 *  on-the-fly background-removal transformation (first hit is async). */
async function fetchImageBytes(url: string): Promise<Buffer> {
  let lastStatus = 0;
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    lastStatus = res.status;
    // 423 Locked / 420-ish = "resource is processing" — wait and retry.
    if (res.status === 423 || res.status === 420 || res.status === 429) {
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      continue;
    }
    break;
  }
  throw new Error(`Could not fetch image (HTTP ${lastStatus || "error"}).`);
}

const POTRACE_OPTIONS: PotraceOptions = {
  // Trace the dark silhouette we build below on a white background.
  blackOnWhite: true,
  threshold: 128,
  turdSize: 80, // drop tiny speckles
  optTolerance: 0.4,
  color: "#000",
  background: "#fff",
};

function traceSvg(png: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    trace(png, POTRACE_OPTIONS, (err, svg) => (err ? reject(err) : resolve(svg)));
  });
}

/**
 * Rebuild potrace's output into a tightly-shaped, theme-able SVG: keep only the
 * `viewBox` and the path geometry, drop width/height and any colours, and set
 * `fill="currentColor"` so it inherits the nav text/active colour. Rebuilding
 * from extracted values (rather than passing potrace markup through) also means
 * the stored string is safe to render inline.
 */
function normalizeSvg(raw: string): string | null {
  const viewBox = raw.match(/viewBox="([^"]+)"/i)?.[1];
  const paths = [...raw.matchAll(/<path\b[^>]*\bd="([^"]+)"[^>]*\/?>/gi)].map((m) => m[1]);
  if (!viewBox || paths.length === 0) return null;
  const body = paths.map((d) => `<path d="${d}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="currentColor">${body}</svg>`;
}

/** Convert image bytes into a black-silhouette-on-white PNG for tracing. */
async function toSilhouettePng(bytes: Buffer): Promise<Buffer> {
  return sharp(bytes)
    .ensureAlpha()
    .resize({ width: 512, height: 512, fit: "inside", withoutEnlargement: true })
    .extractChannel("alpha") // opaque subject = white(255), transparent bg = black(0)
    .negate() //               subject -> black, bg -> white  (for blackOnWhite trace)
    .threshold(160) //          clean binary mask
    .png()
    .toBuffer();
}

export interface CategoryIcon {
  /** Transparent image URL to persist as `Category.image`. */
  image: string;
  /** Monochrome silhouette SVG to persist as `Category.iconSvg` (may be null if tracing failed). */
  iconSvg: string | null;
  /** True when Cloudinary background removal could not be used. */
  backgroundRemovalFailed: boolean;
}

/**
 * Build the stored image + traced icon for a freshly uploaded category photo.
 * Prefers the Cloudinary background-removed version; if that can't be fetched
 * (add-on not enabled, etc.) it transparently falls back to the original image
 * so a save never hard-fails.
 */
export async function buildCategoryIcon(originalUrl: string): Promise<CategoryIcon> {
  const removedUrl = backgroundRemovedUrl(originalUrl);

  // Try the background-removed image first.
  if (removedUrl) {
    try {
      const bytes = await fetchImageBytes(removedUrl);
      const svg = await traceBytesToSvg(bytes);
      return { image: removedUrl, iconSvg: svg, backgroundRemovalFailed: false };
    } catch {
      // fall through to original
    }
  }

  // Fallback: original image (no transparency), still trace a silhouette.
  try {
    const bytes = await fetchImageBytes(originalUrl);
    const svg = await traceBytesToSvg(bytes);
    return { image: originalUrl, iconSvg: svg, backgroundRemovalFailed: true };
  } catch {
    return { image: originalUrl, iconSvg: null, backgroundRemovalFailed: true };
  }
}

/**
 * Background-removal only (no tracing) — for brand logos. Derives the
 * transparent Cloudinary URL and fetches it to confirm it's reachable (and to
 * warm the on-the-fly transform); falls back to the original URL if the add-on
 * isn't available so a save never hard-fails.
 */
export async function backgroundRemovedImage(
  originalUrl: string,
): Promise<{ image: string; backgroundRemovalFailed: boolean }> {
  const removedUrl = backgroundRemovedUrl(originalUrl);
  if (removedUrl) {
    try {
      await fetchImageBytes(removedUrl);
      return { image: removedUrl, backgroundRemovalFailed: false };
    } catch {
      // fall through to the original
    }
  }
  return { image: originalUrl, backgroundRemovalFailed: true };
}

/** Trace raw image bytes into a normalized silhouette SVG (null on failure). */
export async function traceBytesToSvg(bytes: Buffer): Promise<string | null> {
  try {
    const png = await toSilhouettePng(bytes);
    return normalizeSvg(await traceSvg(png));
  } catch (err) {
    console.error("[category-icon] trace failed:", err);
    return null;
  }
}
