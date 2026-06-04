/* ------------------------------------------------------------------ */
/* Shared brand catalog — used by the homepage strip and /brands page   */
/* Mock data — replace with DB query in Phase 3.                        */
/* `productCount` is illustrative until the catalog is wired up.        */
/* ------------------------------------------------------------------ */

export interface Brand {
  name: string;
  slug: string;
  tagline: string;
  productCount: number;
  featured?: boolean;
  /** Simple Icons slug — used when no `logoUrl` is supplied. */
  logoSlug?: string;
  /** Explicit logo URL (local `/brands/*` asset or external CDN). Wins over `logoSlug`. */
  logoUrl?: string;
  /** Separate artwork for dark mode — for multi-colour logos that can't simply be inverted. */
  logoUrlDark?: string;
  /** Render the logo on a dark chip — for reversed/white logos meant for dark backgrounds. */
  darkChip?: boolean;
  /** Invert the logo in dark mode — for single-color (black) logos that should flip to white. */
  invertOnDark?: boolean;
}

export const BRANDS: Brand[] = [
  { name: "Samsung", slug: "samsung", tagline: "Phones, tablets & TVs", productCount: 24, featured: true, logoSlug: "samsung" },
  { name: "Apple", slug: "apple", tagline: "iPhone, iPad & Mac", productCount: 18, featured: true, logoSlug: "apple" },
  { name: "LG", slug: "lg", tagline: "TVs & home appliances", productCount: 16, featured: true, logoSlug: "lg" },
  { name: "Sony", slug: "sony", tagline: "Audio & gaming", productCount: 14, featured: true, logoUrl: "https://cdn.simpleicons.org/sony/000000", invertOnDark: true },
  { name: "Panasonic", slug: "panasonic", tagline: "Kitchen & home appliances", productCount: 11, logoSlug: "panasonic" },
  { name: "Binatone", slug: "binatone", tagline: "Fans & small appliances", productCount: 9, logoUrl: "/brands/binatone.png", logoUrlDark: "/brands/binatone-dark.png" },
  { name: "Tecno", slug: "tecno", tagline: "Affordable smartphones", productCount: 8, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Tecno_Mobile_logo.svg" },
  { name: "Dell", slug: "dell", tagline: "Laptops & monitors", productCount: 7, logoSlug: "dell" },
  { name: "HP", slug: "hp", tagline: "Laptops & printers", productCount: 7, logoSlug: "hp" },
  { name: "JBL", slug: "jbl", tagline: "Speakers & headphones", productCount: 6, logoSlug: "jbl" },
  { name: "Anker", slug: "anker", tagline: "Chargers & power banks", productCount: 6, logoUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2b/Anker_Logo.svg" },
  { name: "Nikon", slug: "nikon", tagline: "Cameras & lenses", productCount: 4, logoSlug: "nikon" },
  { name: "Mewe", slug: "mewe", tagline: "Home appliances", productCount: 5, logoUrl: "/brands/mewe.png" },
  { name: "Iwin", slug: "iwin", tagline: "Small appliances", productCount: 4, logoUrl: "/brands/iwin.png" },
  { name: "Ambiano", slug: "ambiano", tagline: "Kitchen appliances", productCount: 4, logoUrl: "/brands/ambiano.png" },
  { name: "Tower", slug: "tower", tagline: "Cookware & appliances", productCount: 3, logoUrl: "/brands/tower.png" },
  { name: "Silvercrest", slug: "silvercrest", tagline: "Home & kitchen", productCount: 3, logoUrl: "/brands/silver_crest.png", invertOnDark: true },
];

/** Link to the catalog filtered by brand name (matches the /products brand filter). */
export function brandHref(name: string) {
  return `/products?brand=${encodeURIComponent(name)}`;
}
