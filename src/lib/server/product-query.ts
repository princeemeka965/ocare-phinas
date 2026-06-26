/* Shared helpers for querying the flattened "ProductCard" view and reshaping
 * its rows back into the nested { ...product, category, brand } shape the API
 * returned under Prisma (so client consumers are unchanged). */

import type { Product } from "@/lib/db/types";

/** Escape a free-text term for use inside a PostgREST quoted .or() pattern. */
export function ilikePattern(q: string): string {
  return `%${q.replace(/[\\"]/g, "\\$&")}%`;
}

/** OR clause that matches a term against product/brand/category name (flat view cols). */
export function nameOrClause(q: string): string {
  const p = ilikePattern(q);
  return `name.ilike."${p}",brandName.ilike."${p}",categoryName.ilike."${p}"`;
}

export interface ProductCardRow extends Product {
  categorySlug: string | null;
  categoryName: string | null;
  brandName: string | null;
  brandSlug: string | null;
}

export interface NestedProduct extends Product {
  category: { name: string; slug: string } | null;
  brand: { name: string; slug: string } | null;
}

/** Turn a flat view row into the nested product shape (category/brand objects). */
export function reshapeProduct(row: ProductCardRow): NestedProduct {
  const { categorySlug, categoryName, brandName, brandSlug, ...product } = row;
  return {
    ...(product as Product),
    category: categorySlug ? { name: categoryName ?? "", slug: categorySlug } : null,
    brand: brandName ? { name: brandName, slug: brandSlug ?? "" } : null,
  };
}
