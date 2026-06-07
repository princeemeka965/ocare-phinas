import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpDown, X, Check, Tag, ChevronDown } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/storefront/product-card";
import { listProducts, listCategories, listBrandNames } from "@/lib/server/catalog";

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

const SORTS = [
  { value: "", label: "Newest" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
];

type Filters = {
  category?: string;
  brand?: string;
  condition?: string;
  sort?: string;
  instock?: string;
};

interface PageProps {
  searchParams: Promise<Filters>;
}

/** Build an href to /products with `changes` merged into the current filters. */
function buildHref(current: Filters, changes: Partial<Filters>): string {
  const merged: Record<string, string> = {};
  for (const [k, v] of Object.entries({ ...current, ...changes })) {
    if (v) merged[k] = v;
  }
  const qs = new URLSearchParams(merged).toString();
  return qs ? `/products?${qs}` : "/products";
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const filters = await searchParams;

  /* DB-backed: filtering + sorting happen in the query. */
  const [products, categoriesRaw, brandNames] = await Promise.all([
    listProducts(filters),
    listCategories(),
    listBrandNames(),
  ]);
  const categories = categoriesRaw.map((c) => ({ slug: c.slug, label: c.name }));
  const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(categories.map((c) => [c.slug, c.label]));
  const brands = brandNames;

  const activeChips = [
    filters.category && {
      label: `Category: ${CATEGORY_LABELS[filters.category] ?? filters.category}`,
      href: buildHref(filters, { category: undefined }),
    },
    filters.brand && {
      label: `Brand: ${filters.brand}`,
      href: buildHref(filters, { brand: undefined }),
    },
    filters.condition && {
      label: `Condition: ${filters.condition === "new" ? "New" : "Pre-owned"}`,
      href: buildHref(filters, { condition: undefined }),
    },
    filters.instock === "1" && {
      label: "In stock only",
      href: buildHref(filters, { instock: undefined }),
    },
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
            {products.length} {products.length === 1 ? "product" : "products"}
            {hasFilters ? " match your filters" : " in our catalog"}
          </p>
        </div>

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
                <Link
                  key={chip.label}
                  href={chip.href}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/30 bg-primary/10 text-caption text-primary font-medium hover:bg-primary/15 transition-colors"
                >
                  {chip.label}
                  <X className="size-3" aria-hidden />
                  <span className="sr-only">Remove filter</span>
                </Link>
              ))}
              {hasFilters && (
                <Link
                  href="/products"
                  className="text-caption text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  Clear all
                </Link>
              )}

              {/* Sort */}
              <div className="ml-auto flex items-center gap-2">
                <ArrowUpDown className="size-4 text-muted-foreground" aria-hidden />
                <div className="flex items-center gap-1">
                  {SORTS.map((s) => {
                    const active = (filters.sort ?? "") === s.value;
                    return (
                      <Link
                        key={s.value || "newest"}
                        href={buildHref(filters, { sort: s.value || undefined })}
                        className={cn(
                          "text-caption px-2.5 py-1.5 rounded-md transition-colors",
                          active
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                        aria-current={active ? "true" : undefined}
                      >
                        {s.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
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
                    href={buildHref(filters, {
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
                    href={buildHref(filters, {
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
                    href={buildHref(filters, {
                      condition: filters.condition === opt.value ? undefined : opt.value,
                    })}
                  />
                ))}
              </MobileFilterGroup>

              <div className="rounded-xl border border-border bg-card px-2 py-1.5">
                <FilterLink
                  label="In stock only"
                  active={filters.instock === "1"}
                  href={buildHref(filters, {
                    instock: filters.instock === "1" ? undefined : "1",
                  })}
                />
              </div>
            </div>

            {/* Grid */}
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-dashed border-border">
                <div className="size-14 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Tag className="size-7 text-muted-foreground" aria-hidden />
                </div>
                <p className="text-h3 font-semibold mb-2">No products found</p>
                <p className="text-body-sm text-muted-foreground mb-5 max-w-[34ch]">
                  Nothing matches your current filters. Try clearing them to see the full catalog.
                </p>
                <Link href="/products" className={buttonVariants({ variant: "outline" })}>
                  Clear filters
                </Link>
              </div>
            )}
          </div>
        </div>
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
            href={buildHref(filters, {
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
            href={buildHref(filters, {
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
            href={buildHref(filters, {
              condition: filters.condition === opt.value ? undefined : opt.value,
            })}
          />
        ))}
      </FilterGroup>

      {/* In stock */}
      <FilterLink
        label="In stock only"
        active={filters.instock === "1"}
        href={buildHref(filters, {
          instock: filters.instock === "1" ? undefined : "1",
        })}
      />
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-body-sm font-semibold mb-3">{title}</h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

/* Mobile collapsible filter. `name` makes the three groups mutually exclusive —
   opening one closes the others. Closed by default, so no content shows until tapped. */
function MobileFilterGroup({
  title,
  selected,
  children,
}: {
  title: string;
  selected?: string;
  children: ReactNode;
}) {
  return (
    <details
      name="mobile-filter"
      className="group rounded-xl border border-border bg-card overflow-hidden"
    >
      <summary className="flex items-center justify-between gap-2 px-4 py-3 cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2 text-body-sm font-semibold">
          {title}
          {selected && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-micro font-medium text-primary">
              {selected}
            </span>
          )}
        </span>
        <ChevronDown
          className="size-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="border-t border-border px-2 py-2 space-y-0.5">{children}</div>
    </details>
  );
}

function FilterLink({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-body-sm transition-colors",
        active
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
      aria-pressed={active}
    >
      <span>{label}</span>
      {active && <Check className="size-3.5 flex-shrink-0" aria-hidden />}
    </Link>
  );
}
