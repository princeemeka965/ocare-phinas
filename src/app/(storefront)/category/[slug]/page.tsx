import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";

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
import { listProductsPaged, getCategoryBySlug, listBrandNames } from "@/lib/server/catalog";

const PREOWNED_SLUG = "pre-owned";

type Filters = {
  brand?: string;
  condition?: string;
  sort?: string;
  instock?: string;
  minPrice?: string;
  maxPrice?: string;
  page?: string;
};

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Filters>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const isPreowned = slug === PREOWNED_SLUG;
  const category = isPreowned ? null : await getCategoryBySlug(slug);
  const label = isPreowned ? "Pre-owned (Tokunbo / UK Used)" : category?.name ?? slug;
  return {
    title: `${label} — OCare Phinas`,
    description: `Shop genuine ${label.toLowerCase()} in Nigeria. Bank transfer payment with manual confirmation.`,
  };
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

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const filters = await searchParams;
  const basePath = `/category/${slug}`;

  const isPreowned = slug === PREOWNED_SLUG;
  const category = isPreowned ? null : await getCategoryBySlug(slug);
  const label = isPreowned ? "Pre-owned (Tokunbo / UK Used)" : category?.name ?? slug;
  const page = Math.max(1, Number(filters.page) || 1);

  /* Pre-owned is a condition view; otherwise filter by this category slug. */
  const [paged, brands] = await Promise.all([
    listProductsPaged(
      {
        ...(isPreowned ? {} : { category: slug }),
        brand: filters.brand,
        condition: isPreowned ? "used" : filters.condition,
        instock: filters.instock,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        sort: filters.sort,
      },
      page,
    ),
    listBrandNames(),
  ]);
  const { products, total, page: currentPage, pages } = paged;

  const activeChips = [
    filters.brand && {
      label: `Brand: ${filters.brand}`,
      href: buildFilterHref(basePath, filters, { brand: undefined }),
    },
    !isPreowned &&
      filters.condition && {
        label: `Condition: ${filters.condition === "new" ? "New" : "Pre-owned"}`,
        href: buildFilterHref(basePath, filters, { condition: undefined }),
      },
    filters.instock === "1" && {
      label: "In stock only",
      href: buildFilterHref(basePath, filters, { instock: undefined }),
    },
    (() => {
      const priceLabel = priceChipLabel(filters.minPrice, filters.maxPrice);
      return (
        priceLabel && {
          label: priceLabel,
          href: buildFilterHref(basePath, filters, { minPrice: undefined, maxPrice: undefined }),
        }
      );
    })(),
  ].filter(Boolean) as { label: string; href: string }[];

  const hasFilters = activeChips.length > 0;

  return (
    <div className="py-8 sm:py-12">
      <Container>
        {/* Page heading */}
        <div className="mb-8">
          <nav className="text-caption text-muted-foreground mb-2" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span className="mx-1.5">/</span>
            <span className="text-foreground">{label}</span>
          </nav>
          <div className="flex items-end gap-4">
            <div>
              <h1 className="text-h1 font-bold">{label}</h1>
              <p className="text-muted-foreground mt-1">
                {total} {total === 1 ? "product" : "products"}
                {hasFilters ? " match your filters" : " found"}
                {pages > 1 ? ` · page ${currentPage} of ${pages}` : ""}
              </p>
            </div>
          </div>
        </div>

        <CatalogNavProvider>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filters — desktop */}
          <aside className="hidden lg:block w-56 flex-shrink-0" aria-label="Filters">
            <FilterPanel basePath={basePath} filters={filters} isPreowned={isPreowned} brands={brands} />
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
                  href={basePath}
                  className="text-caption text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  Clear all
                </CatalogNavLink>
              )}

              {/* Sort */}
              <SortLinks basePath={basePath} filters={filters} />
            </div>

            {/* Mobile filters — collapsible dropdowns, none open by default */}
            <div className="lg:hidden mb-6 space-y-2">
              <MobileFilterGroup title="Brand" selected={filters.brand}>
                {brands.map((b) => (
                  <FilterLink
                    key={b}
                    label={b}
                    active={filters.brand === b}
                    href={buildFilterHref(basePath, filters, {
                      brand: filters.brand === b ? undefined : b,
                    })}
                  />
                ))}
              </MobileFilterGroup>

              {!isPreowned && (
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
                      href={buildFilterHref(basePath, filters, {
                        condition: filters.condition === opt.value ? undefined : opt.value,
                      })}
                    />
                  ))}
                </MobileFilterGroup>
              )}

              <MobileFilterGroup
                title="Price"
                selected={priceChipLabel(filters.minPrice, filters.maxPrice) || undefined}
              >
                <div className="px-2 py-1.5">
                  <PriceRangeForm basePath={basePath} filters={filters} />
                </div>
              </MobileFilterGroup>

              <div className="rounded-xl border border-border bg-card px-2 py-1.5">
                <FilterLink
                  label="In stock only"
                  active={filters.instock === "1"}
                  href={buildFilterHref(basePath, filters, {
                    instock: filters.instock === "1" ? undefined : "1",
                  })}
                />
              </div>
            </div>

            {/* Product grid — on mobile a filter tap scrolls here at once; the
                old results dim behind a loading pill until the server responds. */}
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
                  hrefFor={(p) => buildFilterHref(basePath, filters, { page: p === 1 ? undefined : String(p) })}
                  className="mt-10"
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-dashed border-border">
                <p className="text-h3 font-semibold mb-2">No products found</p>
                <p className="text-body-sm text-muted-foreground mb-5">
                  Try adjusting or clearing your filters.
                </p>
                <CatalogNavLink href={basePath} className={buttonVariants({ variant: "outline" })}>
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

function FilterPanel({
  basePath,
  filters,
  isPreowned,
  brands,
}: {
  basePath: string;
  filters: Filters;
  isPreowned: boolean;
  brands: string[];
}) {
  return (
    <div className="space-y-7">
      {/* Brand */}
      <FilterGroup title="Brand">
        {brands.map((b) => (
          <FilterLink
            key={b}
            label={b}
            active={filters.brand === b}
            href={buildFilterHref(basePath, filters, {
              brand: filters.brand === b ? undefined : b,
            })}
          />
        ))}
      </FilterGroup>

      {/* Condition (hidden on the Pre-owned view — it's forced there) */}
      {!isPreowned && (
        <FilterGroup title="Condition">
          {[
            { value: "new", label: "New" },
            { value: "pre_owned", label: "Pre-owned (Tokunbo / UK Used)" },
          ].map((opt) => (
            <FilterLink
              key={opt.value}
              label={opt.label}
              active={filters.condition === opt.value}
              href={buildFilterHref(basePath, filters, {
                condition: filters.condition === opt.value ? undefined : opt.value,
              })}
            />
          ))}
        </FilterGroup>
      )}

      {/* In stock */}
      <FilterLink
        label="In stock only"
        active={filters.instock === "1"}
        href={buildFilterHref(basePath, filters, {
          instock: filters.instock === "1" ? undefined : "1",
        })}
      />

      {/* Price range */}
      <PriceRangeForm basePath={basePath} filters={filters} />
    </div>
  );
}
