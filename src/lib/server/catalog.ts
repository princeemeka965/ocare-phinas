/* ------------------------------------------------------------------ *
 * Storefront catalog reads — direct DB access for server components.    *
 * (The public /api/products etc. routes remain for client use.)        *
 * ------------------------------------------------------------------ */

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { LOW_STOCK_THRESHOLD } from "@/lib/slug";
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
  q?: string;
}

type ProductWithRel = Prisma.ProductGetPayload<{
  include: { category: { select: { slug: true } }; brand: { select: { name: true } } };
}>;

function toCard(p: ProductWithRel): ProductCardData {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brand?.name ?? "",
    price: p.price,
    stockQuantity: p.stockQuantity,
    stockLabel: stockLabel(p.stockQuantity),
    categorySlug: p.category?.slug ?? "accessories",
    condition: p.condition === "new" ? "new" : "pre_owned",
    image: p.images[0],
  };
}

/** Default products shown per page on the storefront listing grids. */
export const PRODUCTS_PER_PAGE = 12;

function buildWhere(f: CatalogFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { active: true };
  if (f.category) where.category = { slug: f.category };
  if (f.brand) where.brand = { name: f.brand };
  if (f.condition === "new") where.condition = "new";
  if (f.condition === "pre_owned" || f.condition === "used") where.condition = "used";
  if (f.instock === "1") where.stockQuantity = { gt: 0 };
  if (f.q) where.name = { contains: f.q, mode: "insensitive" };
  return where;
}

function buildOrderBy(f: CatalogFilters): Prisma.ProductOrderByWithRelationInput {
  return f.sort === "price_asc"
    ? { price: "asc" }
    : f.sort === "price_desc"
      ? { price: "desc" }
      : { createdAt: "desc" };
}

const CARD_INCLUDE = {
  category: { select: { slug: true } },
  brand: { select: { name: true } },
} satisfies Prisma.ProductInclude;

export async function listProducts(f: CatalogFilters = {}, limit?: number): Promise<ProductCardData[]> {
  const products = await prisma.product.findMany({
    where: buildWhere(f),
    orderBy: buildOrderBy(f),
    include: CARD_INCLUDE,
    ...(limit ? { take: limit } : {}),
  });
  return products.map(toCard);
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
  const where = buildWhere(f);
  const safePage = Math.max(1, Math.floor(page) || 1);
  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: buildOrderBy(f),
      include: CARD_INCLUDE,
      skip: (safePage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return { products: rows.map(toCard), total, page: Math.min(safePage, pages), pages, pageSize };
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, active: true },
    include: { category: { select: { name: true, slug: true } }, brand: { select: { name: true, slug: true } } },
  });
}

export async function listCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" }, select: { name: true, slug: true } });
}

export async function listBrandNames(): Promise<string[]> {
  const brands = await prisma.brand.findMany({ orderBy: { name: "asc" }, select: { name: true } });
  return brands.map((b) => b.name);
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({ where: { slug }, select: { name: true, slug: true } });
}

export async function listBrands() {
  return prisma.brand.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, logo: true, _count: { select: { products: true } } },
  });
}
