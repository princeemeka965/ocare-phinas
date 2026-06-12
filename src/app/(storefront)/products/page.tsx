import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Tag } from "lucide-react";

import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { ProductCard } from "@/components/storefront/product-card";
import {
  buildFilterHref,
  CatalogNavLink,
  CatalogNavProvider,
  CatalogResults,
  FilterChip,
  FilterGroup,
  FilterLink,
  MobileFilterGroup,
  PriceRangeForm,
  RESULTS_ID,
  SortLinks,
} from "@/components/storefront/catalog-filters";
import { ScrollToResults } from "@/components/storefront/scroll-to-results";
import { listProductsPaged, listCategories, listBrandNames } from "@/lib/server/catalog";

export const metadata: Metadata = {
  title: "All Products — OCare Phinas",
  description:
    "Browse the full OCare Phinas catalog — phones, laptops, audio, appliances and genuine pre-owned electronics. Bank transfer payment with manual confirmation.",
  openGraph: {
    title: "All Products — OCare Phinas",
    description:
      "Shop genuine electronics in Nigeria. New and pre-owned (Tokunbo) gadgets at honest prices.",
  },
};

const BASE_PATH = "/products";

type Filters = {
  category?: string;
  brand?: string;
  condition?: string;
  sort?: string;
  instock?: string;
  minPrice?: string;
  maxPrice?: string;
  page?: string;
};

interface PageProps {
  searchParams: Promise<Filters>;
}

/** Chip label for an active min/max price filter. */
function priceChipLabel(min?: string, max?: string): string | false {
  const lo = Number(min) > 0 ? `₦${Number(min).toLocaleString("en-NG")}` : "";
  const hi = Number(max) > 0 ? `₦${Number(max).toLocaleString("en-NG")}` : "";
  if (lo && hi) return `Price: ${lo} – ${hi}`;
  if (lo) return `Price: from ${lo}`;
  if (hi) return `Price: up to ${hi}`;
  return false;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const filters = await searchParams;
  const page = Math.max(1, Number(filters.page) || 1);

  /* DB-backed: filtering + sorting + pagination happen in the query. */
  const [paged, categoriesRaw, brandNames] = await Promise.all([
    listProductsPaged(filters, page),
    listCategories(),
    listBrandNames(),
  ]);
  const { products, total, page: currentPage, pages } = paged;
  const categories = categoriesRaw.map((c) => ({ slug: c.slug, label: c.name }));
  const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(categories.map((c) => [c.slug, c.label]));
  const brands = brandNames;

  const activeChips = [
    filters.category && {
      label: `Category: ${CATEGORY_LABELS[filters.category] ?? filters.category}`,
      href: buildFilterHref(BASE_PATH, filters, { category: undefined }),
    },
    filters.brand && {
      label: `Brand: ${filters.brand}`,
      href: buildFilterHref(BASE_PATH, filters, { brand: undefined }),
    },
    filters.condition && {
      label: `Condition: ${filters.condition === "new" ? "New" : "Pre-owned"}`,
      href: buildFilterHref(BASE_PATH, filters, { condition: undefined }),
    },
    filters.instock === "1" && {
      label: "In stock only",
      href: buildFilterHref(BASE_PATH, filters, { instock: undefined }),
    },
    (() => {
      const priceLabel = priceChipLabel(filters.minPrice, filters.maxPrice);
      return (
        priceLabel && {
          label: priceLabel,
          href: buildFilterHref(BASE_PATH, filters, { minPrice: undefined, maxPrice: undefined }),
        }
      );
    })(),
  ].filter(Boolean) as { label: string; href: string }[];

  const hasFilters = activeChips.length > 0;

  return (
    <div className="py-8 sm:py-12">
      <Container>
        {/* Heading */}
        <div className="mb-8">
          <nav className="text-caption text-muted-foreground mb-2" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span className="mx-1.5">/</span>
            <span className="text-foreground">All Products</span>
          </nav>
          <h1 className="text-h1 font-bold">All Products</h1>
          <p className="text-muted-foreground mt-1">
            {total} {total === 1 ? "product" : "products"}
            {hasFilters ? " match your filters" : " in our catalog"}
            {pages > 1 ? ` · page ${currentPage} of ${pages}` : ""}
          </p>
        </div>

        <CatalogNavProvider>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filters */}
          <aside className="hidden lg:block w-60 flex-shrink-0" aria-label="Filters">
            <FilterPanel filters={filters} categories={categories} brands={brands} />
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              {activeChips.map((chip) => (
                <FilterChip key={chip.label} label={chip.label} href={chip.href} />
              ))}
              {hasFilters && (
                <CatalogNavLink
                  href={BASE_PATH}
                  className="text-caption text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  Clear all
                </CatalogNavLink>
              )}

              {/* Sort */}
              <SortLinks basePath={BASE_PATH} filters={filters} />
            </div>

            {/* Mobile filters — collapsible dropdowns, none open by default */}
            <div className="lg:hidden mb-6 space-y-2">
              <MobileFilterGroup
                title="Category"
                selected={filters.category ? CATEGORY_LABELS[filters.category] ?? filters.category : undefined}
              >
                {categories.map((c) => (
                  <FilterLink
                    key={c.slug}
                    label={c.label}
                    active={filters.category === c.slug}
                    href={buildFilterHref(BASE_PATH, filters, {
                      category: filters.category === c.slug ? undefined : c.slug,
                    })}
                  />
                ))}
              </MobileFilterGroup>

              <MobileFilterGroup title="Brand" selected={filters.brand}>
                {brands.map((b) => (
                  <FilterLink
                    key={b}
                    label={b}
                    active={filters.brand === b}
                    href={buildFilterHref(BASE_PATH, filters, {
                      brand: filters.brand === b ? undefined : b,
                    })}
                  />
                ))}
              </MobileFilterGroup>

              <MobileFilterGroup
                title="Condition"
                selected={filters.condition ? (filters.condition === "new" ? "New" : "Pre-owned") : undefined}
              >
                {[
                  { value: "new", label: "New" },
                  { value: "pre_owned", label: "Pre-owned (Tokunbo / UK Used)" },
                ].map((opt) => (
                  <FilterLink
                    key={opt.value}
                    label={opt.label}
                    active={filters.condition === opt.value}
                    href={buildFilterHref(BASE_PATH, filters, {
                      condition: filters.condition === opt.value ? undefined : opt.value,
                    })}
                  />
                ))}
              </MobileFilterGroup>

              <MobileFilterGroup
                title="Price"
                selected={priceChipLabel(filters.minPrice, filters.maxPrice) || undefined}
              >
                <div className="px-2 py-1.5">
                  <PriceRangeForm basePath={BASE_PATH} filters={filters} />
                </div>
              </MobileFilterGroup>

              <div className="rounded-xl border border-border bg-card px-2 py-1.5">
                <FilterLink
                  label="In stock only"
                  active={filters.instock === "1"}
                  href={buildFilterHref(BASE_PATH, filters, {
                    instock: filters.instock === "1" ? undefined : "1",
                  })}
                />
              </div>
            </div>

            {/* Grid — on mobile a filter tap scrolls here at once; the old
                results dim behind a loading pill until the server responds. */}
            <Suspense fallback={null}>
              <ScrollToResults targetId={RESULTS_ID} />
            </Suspense>
            <CatalogResults>
            {products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                <Pagination
                  page={currentPage}
                  pages={pages}
                  hrefFor={(p) => buildFilterHref(BASE_PATH, filters, { page: p === 1 ? undefined : String(p) })}
                  className="mt-10"
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-dashed border-border">
                <div className="size-14 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Tag className="size-7 text-muted-foreground" aria-hidden />
                </div>
                <p className="text-h3 font-semibold mb-2">No products found</p>
                <p className="text-body-sm text-muted-foreground mb-5 max-w-[34ch]">
                  Nothing matches your current filters. Try clearing them to see the full catalog.
                </p>
                <CatalogNavLink href={BASE_PATH} className={buttonVariants({ variant: "outline" })}>
                  Clear filters
                </CatalogNavLink>
              </div>
            )}
            </CatalogResults>
          </div>
        </div>
        </CatalogNavProvider>
      </Container>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Filter panel — link-driven so it works without client JS            */
/* ------------------------------------------------------------------ */
function FilterPanel({
  filters,
  categories,
  brands,
}: {
  filters: Filters;
  categories: { slug: string; label: string }[];
  brands: string[];
}) {
  return (
    <div className="space-y-7">
      {/* Category */}
      <FilterGroup title="Category">
        {categories.map((c) => (
          <FilterLink
            key={c.slug}
            label={c.label}
            active={filters.category === c.slug}
            href={buildFilterHref(BASE_PATH, filters, {
              category: filters.category === c.slug ? undefined : c.slug,
            })}
          />
        ))}
      </FilterGroup>

      {/* Brand */}
      <FilterGroup title="Brand">
        {brands.map((b) => (
          <FilterLink
            key={b}
            label={b}
            active={filters.brand === b}
            href={buildFilterHref(BASE_PATH, filters, {
              brand: filters.brand === b ? undefined : b,
            })}
          />
        ))}
      </FilterGroup>

      {/* Condition */}
      <FilterGroup title="Condition">
        {[
          { value: "new", label: "New" },
          { value: "pre_owned", label: "Pre-owned (Tokunbo / UK Used)" },
        ].map((opt) => (
          <FilterLink
            key={opt.value}
            label={opt.label}
            active={filters.condition === opt.value}
            href={buildFilterHref(BASE_PATH, filters, {
              condition: filters.condition === opt.value ? undefined : opt.value,
            })}
          />
        ))}
      </FilterGroup>

      {/* In stock */}
      <FilterLink
        label="In stock only"
        active={filters.instock === "1"}
        href={buildFilterHref(BASE_PATH, filters, {
          instock: filters.instock === "1" ? undefined : "1",
        })}
      />

      {/* Price range */}
      <PriceRangeForm basePath={BASE_PATH} filters={filters} />
    </div>
  );
}
