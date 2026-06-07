import type { Metadata } from "next";
import Link from "next/link";
import { SlidersHorizontal, ArrowUpDown, X } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProductCard, ProductCardSkeleton } from "@/components/storefront/product-card";
import { listProducts, getCategoryBySlug, listBrandNames } from "@/lib/server/catalog";

const PREOWNED_SLUG = "pre-owned";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    brand?: string;
    condition?: string;
    sort?: string;
    instock?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
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

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const filters = await searchParams;

  const isPreowned = slug === PREOWNED_SLUG;
  const category = isPreowned ? null : await getCategoryBySlug(slug);
  const label = isPreowned ? "Pre-owned (Tokunbo / UK Used)" : category?.name ?? slug;

  /* Pre-owned is a condition view; otherwise filter by this category slug. */
  const [products, brands] = await Promise.all([
    listProducts({
      ...(isPreowned ? { condition: "used" } : { category: slug }),
      brand: filters.brand,
      condition: isPreowned ? "used" : filters.condition,
      instock: filters.instock,
      sort: filters.sort,
    }),
    listBrandNames(),
  ]);

  const activeFilters = [
    filters.brand && `Brand: ${filters.brand}`,
    filters.condition && `Condition: ${filters.condition === "new" ? "New" : "Pre-owned"}`,
    filters.instock === "1" && "In stock only",
  ].filter(Boolean) as string[];

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
                {products.length} {products.length === 1 ? "product" : "products"} found
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filters — desktop */}
          <aside className="hidden lg:block w-56 flex-shrink-0 space-y-6" aria-label="Filters">
            <FilterPanel slug={slug} filters={filters} isPreowned={isPreowned} brands={brands} />
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              {/* Mobile filter button */}
              <button className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-body-sm hover:bg-muted transition-colors">
                <SlidersHorizontal className="size-4" />
                Filters
                {activeFilters.length > 0 && (
                  <Badge variant="default" className="ml-1 text-micro">{activeFilters.length}</Badge>
                )}
              </button>

              {/* Active filter chips */}
              {activeFilters.map((f) => (
                <span
                  key={f}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/30 bg-primary/10 text-caption text-primary font-medium"
                >
                  {f}
                  <X className="size-3 cursor-pointer hover:text-destructive" aria-label={`Remove filter ${f}`} />
                </span>
              ))}

              {/* Sort */}
              <div className="ml-auto flex items-center gap-2">
                <ArrowUpDown className="size-4 text-muted-foreground" aria-hidden />
                <select
                  defaultValue={filters.sort ?? ""}
                  className="text-body-sm border border-input rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring/40"
                  aria-label="Sort products"
                >
                  <option value="">Newest first</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                </select>
              </div>
            </div>

            {/* Product grid */}
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-dashed border-border">
                <p className="text-h3 font-semibold mb-2">No products found</p>
                <p className="text-body-sm text-muted-foreground mb-5">
                  Try adjusting or clearing your filters.
                </p>
                <Link href={`/category/${slug}`} className={buttonVariants({ variant: "outline" })}>
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

function FilterPanel({
  slug,
  filters,
  isPreowned,
  brands,
}: {
  slug: string;
  filters: { brand?: string; condition?: string; instock?: string };
  isPreowned: boolean;
  brands: string[];
}) {
  return (
    <div className="space-y-6">
      {/* Brand filter */}
      <div>
        <h3 className="text-body-sm font-semibold mb-3">Brand</h3>
        <div className="space-y-1.5">
          {brands.map((brand) => (
            <label key={brand} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                defaultChecked={filters.brand === brand}
                className="rounded border-input text-primary focus:ring-primary"
              />
              <span className="text-body-sm text-muted-foreground group-hover:text-foreground transition-colors">
                {brand}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Condition filter (hide on Pre-owned category) */}
      {!isPreowned && (
        <div>
          <h3 className="text-body-sm font-semibold mb-3">Condition</h3>
          <div className="space-y-1.5">
            {[
              { value: "new", label: "New" },
              { value: "pre_owned", label: "Pre-owned (Tokunbo / UK Used)" },
            ].map((opt) => (
              <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="radio"
                  name="condition"
                  value={opt.value}
                  defaultChecked={filters.condition === opt.value}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-body-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* In stock only */}
      <div>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            defaultChecked={filters.instock === "1"}
            className="rounded border-input text-primary focus:ring-primary"
          />
          <span className="text-body-sm font-medium">In stock only</span>
        </label>
      </div>

      {/* Price range */}
      <div>
        <h3 className="text-body-sm font-semibold mb-3">Price Range (₦)</h3>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            className="w-full h-9 px-3 rounded-lg border border-input bg-background text-body-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
          <span className="text-muted-foreground flex-shrink-0">–</span>
          <input
            type="number"
            placeholder="Max"
            className="w-full h-9 px-3 rounded-lg border border-input bg-background text-body-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
      </div>
    </div>
  );
}

export { ProductCardSkeleton };
