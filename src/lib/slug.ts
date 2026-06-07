/** Lowercase, hyphenated, URL-safe slug. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Stock below this counts as "low stock" (admin dashboard "below 3 units"). */
export const LOW_STOCK_THRESHOLD = 3;
