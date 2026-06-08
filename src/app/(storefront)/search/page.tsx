import type { Metadata } from "next";
import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";

import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/storefront/product-card";
import { listProductsPaged } from "@/lib/server/catalog";

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const term = (q ?? "").trim();
  return {
    title: term ? `Search: ${term} — OCare Phinas` : "Search — OCare Phinas",
    robots: { index: false }, // search result pages shouldn't be indexed
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q: rawQ, page: rawPage } = await searchParams;
  const q = (rawQ ?? "").trim();
  const page = Math.max(1, Number(rawPage) || 1);

  const paged = q ? await listProductsPaged({ q }, page) : null;

  const pageHref = (target: number) => {
    const params = new URLSearchParams({ q });
    if (target > 1) params.set("page", String(target));
    return `/search?${params.toString()}`;
  };

  return (
    <div className="py-8 sm:py-12">
      <Container>
        <div className="mb-8">
          <nav className="text-caption text-muted-foreground mb-2" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span className="mx-1.5">/</span>
            <span className="text-foreground">Search</span>
          </nav>
          <h1 className="text-h1 font-bold">
            {q ? <>Results for &ldquo;{q}&rdquo;</> : "Search"}
          </h1>
          {paged && (
            <p className="text-muted-foreground mt-1">
              {paged.total} {paged.total === 1 ? "result" : "results"}
              {paged.pages > 1 ? ` · page ${paged.page} of ${paged.pages}` : ""}
            </p>
          )}
        </div>

        {/* No query typed yet */}
        {!q ? (
          <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-dashed border-border">
            <div className="size-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <SearchIcon className="size-7 text-muted-foreground" aria-hidden />
            </div>
            <p className="text-h3 font-semibold mb-2">Search the catalog</p>
            <p className="text-body-sm text-muted-foreground max-w-[36ch]">
              Type a product, brand or category in the search bar above to find what you&apos;re looking for.
            </p>
          </div>
        ) : paged && paged.products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {paged.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <Pagination page={paged.page} pages={paged.pages} hrefFor={pageHref} className="mt-10" />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-dashed border-border">
            <div className="size-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <SearchIcon className="size-7 text-muted-foreground" aria-hidden />
            </div>
            <p className="text-h3 font-semibold mb-2">No results for &ldquo;{q}&rdquo;</p>
            <p className="text-body-sm text-muted-foreground mb-5 max-w-[40ch]">
              We couldn&apos;t find any products matching that. Try a different term, or browse the full catalog.
            </p>
            <Link href="/products" className={cn(buttonVariants({ variant: "outline" }), "gap-2")}>
              Browse all products
            </Link>
          </div>
        )}
      </Container>
    </div>
  );
}
