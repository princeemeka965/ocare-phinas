import {
  Smartphone,
  Laptop,
  TabletSmartphone,
  Headphones,
  Tv,
  Cable,
  Gamepad2,
  Camera,
  RefreshCw,
  Package,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ *
 * Presentation metadata for categories stored in the database.        *
 * Categories themselves live in the DB (managed from the admin); this *
 * map only decorates known slugs with an icon, accent colour, tile    *
 * artwork and optional short labels. Unknown slugs get a sensible     *
 * default so admin-added categories render without a code change.     *
 * ------------------------------------------------------------------ */

export interface CategoryPresentation {
  icon: LucideIcon;
  color: string;
  image?: string;
  /** Short label for the compact nav strip (defaults to the DB name). */
  navLabel?: string;
  /** Label for the homepage tile (defaults to the DB name). */
  tileLabel?: string;
}

const PRESENTATION: Record<string, CategoryPresentation> = {
  phones: { icon: Smartphone, color: "text-cyan-500", image: "/categories/phones.png" },
  laptops: { icon: Laptop, color: "text-blue-500", image: "/categories/laptops.png" },
  tablets: { icon: TabletSmartphone, color: "text-emerald-500", image: "/categories/tablets.png" },
  audio: { icon: Headphones, color: "text-purple-500", image: "/categories/audio.png" },
  "home-appliances": {
    icon: Tv,
    color: "text-orange-500",
    image: "/categories/appliances.png",
    navLabel: "Appliances",
    tileLabel: "Appliances",
  },
  accessories: { icon: Cable, color: "text-rose-500", image: "/categories/accessories.png" },
  gaming: { icon: Gamepad2, color: "text-red-500", image: "/categories/gaming.png" },
  cameras: { icon: Camera, color: "text-slate-500", image: "/categories/cameras.png" },
  "pre-owned": {
    icon: RefreshCw,
    color: "text-amber-500",
    image: "/categories/pre-owned.png",
    tileLabel: "Pre-owned (Tokunbo)",
  },
};

export function categoryPresentation(slug: string): CategoryPresentation {
  return (
    PRESENTATION[slug] ?? {
      icon: Package,
      color: "text-primary",
      image: `/categories/${slug}.png`,
    }
  );
}

/** Curated display order; unknown slugs follow alphabetically, Pre-owned stays last. */
const DISPLAY_ORDER = [
  "phones",
  "laptops",
  "tablets",
  "audio",
  "home-appliances",
  "accessories",
  "gaming",
  "cameras",
];

function displayWeight(slug: string): number {
  if (slug === "pre-owned") return Number.MAX_SAFE_INTEGER;
  const index = DISPLAY_ORDER.indexOf(slug);
  return index === -1 ? DISPLAY_ORDER.length : index;
}

export function sortCategoriesForDisplay<T extends { slug: string; name: string }>(
  categories: T[],
): T[] {
  return [...categories].sort(
    (a, b) => displayWeight(a.slug) - displayWeight(b.slug) || a.name.localeCompare(b.name),
  );
}
