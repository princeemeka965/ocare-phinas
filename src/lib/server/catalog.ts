/* ------------------------------------------------------------------ *
 * Storefront catalog reads — direct DB access for server components.    *
 * (The public /api/products etc. routes remain for client use.)        *
 * ------------------------------------------------------------------ */

import { supabase, unwrap } from "@/lib/supabase";
import { LOW_STOCK_THRESHOLD } from "@/lib/slug";
import type { Condition } from "@/lib/db/types";
import type { ProductCardData } from "@/components/storefront/product-card";

export type StockLabel = "In stock" | "Low stock" | "Out of stock";

export function stockLabel(qty: number): StockLabel {
  if (qty <= 0) return "Out of stock";
  if (qty <= LOW_STOCK_THRESHOLD) return "Low stock";
  return "In stock";
}

export interface CatalogFilters {
  category?: string; // category slug
  brand?: string; // brand name
  condition?: string; // "new" | "pre_owned" | "used"
  sort?: string; // "price_asc" | "price_desc" | newest
  instock?: string; // "1"
  minPrice?: string; // ₦, inclusive
  maxPrice?: string; // ₦, inclusive
  q?: string;
}

/* A row from the flattened "ProductCard" view (product + category/brand cols). */
interface CardRow {
  id: string;
  name: string;
  slug: string;
  price: number;
  deliveryFee: number;
  stockQuantity: number;
  condition: Condition;
  images: string[];
  categorySlug: string | null;
  brandName: string | null;
}

function toCard(p: CardRow): ProductCardData {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brandName ?? "",
    price: p.price,
    deliveryFee: p.deliveryFee,
    stockQuantity: p.stockQuantity,
    stockLabel: stockLabel(p.stockQuantity),
    categorySlug: p.categorySlug ?? "accessories",
    condition: p.condition === "new" ? "new" : "pre_owned",
    image: p.images[0],
  };
}

/** Default products shown per page on the storefront listing grids. */
export const PRODUCTS_PER_PAGE = 12;

const CARD_COLS = "id,name,slug,price,deliveryFee,stockQuantity,condition,images,categorySlug,brandName";

/** Escape a free-text term for use inside a PostgREST quoted .or() pattern. */
function ilikePattern(q: string): string {
  return `%${q.replace(/[\\"]/g, "\\$&")}%`;
}

/* The Supabase filter builder is chainable; type it loosely for these helpers. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FilterBuilder = any;

/* Apply the shared catalog filters to a query against the "ProductCard" view. */
function applyFilters(query: FilterBuilder, f: CatalogFilters): FilterBuilder {
  let q = query.eq("active", true);
  if (f.category) q = q.eq("categorySlug", f.category);
  if (f.brand) q = q.eq("brandName", f.brand);
  if (f.condition === "new") q = q.eq("condition", "new");
  if (f.condition === "pre_owned" || f.condition === "used") q = q.eq("condition", "used");
  if (f.instock === "1") q = q.gt("stockQuantity", 0);
  const minPrice = Math.floor(Number(f.minPrice));
  const maxPrice = Math.floor(Number(f.maxPrice));
  if (minPrice > 0) q = q.gte("price", minPrice);
  if (maxPrice > 0) q = q.lte("price", maxPrice);
  if (f.q) {
    /* A free-text query matches the product name, its brand, or its category —
       so searching "Apple" or "Phones" surfaces the right products too. */
    const p = ilikePattern(f.q);
    q = q.or(`name.ilike."${p}",brandName.ilike."${p}",categoryName.ilike."${p}"`);
  }
  return q;
}

function applySort(query: FilterBuilder, f: CatalogFilters): FilterBuilder {
  if (f.sort === "price_asc") return query.order("price", { ascending: true });
  if (f.sort === "price_desc") return query.order("price", { ascending: false });
  return query.order("createdAt", { ascending: false });
}

export async function listProducts(f: CatalogFilters = {}, limit?: number): Promise<ProductCardData[]> {
  let query = supabase.from("ProductCard").select(CARD_COLS);
  query = applyFilters(query, f);
  query = applySort(query, f);
  if (limit) query = query.limit(limit);
  const rows = unwrap(await query) as CardRow[];
  return rows.map(toCard);
}

export interface PagedProducts {
  products: ProductCardData[];
  /** Total products matching the filters (across all pages). */
  total: number;
  /** Current 1-based page (clamped to the valid range). */
  page: number;
  /** Total number of pages (at least 1). */
  pages: number;
  pageSize: number;
}

/** Paginated catalog read for the storefront listing grids. */
export async function listProductsPaged(
  f: CatalogFilters = {},
  page = 1,
  pageSize = PRODUCTS_PER_PAGE,
): Promise<PagedProducts> {
  const safePage = Math.max(1, Math.floor(page) || 1);
  let query = supabase.from("ProductCard").select(CARD_COLS, { count: "exact" });
  query = applyFilters(query, f);
  query = applySort(query, f);
  query = query.range((safePage - 1) * pageSize, safePage * pageSize - 1);
  const res = await query;
  if (res.error) throw new Error(res.error.message);
  const total = res.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return { products: (res.data as CardRow[]).map(toCard), total, page: Math.min(safePage, pages), pages, pageSize };
}

export async function getProductBySlug(slug: string) {
  const { data } = await supabase
    .from("Product")
    .select("*, category:Category(name,slug), brand:Brand(name,slug)")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  return data;
}

export async function listCategories() {
  return unwrap(
    await supabase.from("Category").select("name,slug,image,iconSvg").order("name", { ascending: true }),
  );
}

export async function listBrandNames(): Promise<string[]> {
  const brands = unwrap(
    await supabase.from("Brand").select("name").order("name", { ascending: true }),
  ) as { name: string }[];
  return brands.map((b) => b.name);
}

export async function getCategoryBySlug(slug: string) {
  const { data } = await supabase.from("Category").select("name,slug").eq("slug", slug).maybeSingle();
  return data;
}

export async function listBrands() {
  const rows = unwrap(
    await supabase
      .from("Brand")
      .select("id,name,slug,logo,products:Product(count)")
      .order("name", { ascending: true }),
  ) as { id: string; name: string; slug: string; logo: string | null; products: { count: number }[] }[];
  return rows.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    logo: b.logo,
    _count: { products: b.products[0]?.count ?? 0 },
  }));
}
