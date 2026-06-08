"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, Loader2, Tag, Layers } from "lucide-react";

import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface ProductHit {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
}

interface TermHit {
  id: string;
  name: string;
  slug: string;
}

interface Suggestions {
  products: ProductHit[];
  categories: TermHit[];
  brands: TermHit[];
}

const EMPTY: Suggestions = { products: [], categories: [], brands: [] };

interface HeaderSearchProps {
  /** Sizing — the desktop bar is slightly taller than the mobile one. */
  variant?: "desktop" | "mobile";
  /** Called after navigating (e.g. to close the mobile drawer). */
  onNavigate?: () => void;
  className?: string;
}

/**
 * The storefront search box. Submitting (Enter or the "see all" row) goes to
 * `/search?q=…`; typing shows a debounced live dropdown of matching products
 * that link straight to the product page. Keyboard: ↑/↓ to move, Enter to open
 * the highlighted item, Esc to close. Shared by the desktop and mobile headers.
 */
export function HeaderSearch({ variant = "desktop", onNavigate, className }: HeaderSearchProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [q, setQ] = useState("");
  const [data, setData] = useState<Suggestions>(EMPTY);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);

  const products = data.products;

  /* Keep the box in sync with the URL's `q` so the term persists when landing
     on /search (read on the client to avoid a useSearchParams Suspense de-opt). */
  useEffect(() => {
    const term = new URLSearchParams(window.location.search).get("q") ?? "";
    setQ(term);
    setOpen(false);
  }, [pathname]);

  /* Debounced suggestions — products plus matching categories and brands. */
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setData(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      api
        .get<Suggestions>(`/api/search/suggest?q=${encodeURIComponent(term)}`)
        .then((d) => setData(d))
        .catch(() => setData(EMPTY))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  /* Close the dropdown when clicking away. */
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function goToSearch(term?: string) {
    const value = (term ?? q).trim();
    if (!value) return;
    setOpen(false);
    onNavigate?.();
    router.push(`/search?q=${encodeURIComponent(value)}`);
  }

  function navigate(href: string) {
    setOpen(false);
    onNavigate?.();
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, products.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && open && active >= 0 && products[active]) {
      e.preventDefault();
      navigate(`/products/${products[active].slug}`);
    }
  }

  const hasResults = data.products.length + data.categories.length + data.brands.length > 0;

  const showDropdown = open && q.trim().length >= 2;

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          goToSearch();
        }}
        role="search"
      >
        <div className="relative w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
            aria-hidden
          />
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
              setActive(-1);
            }}
            onFocus={() => {
              if (q.trim().length >= 2) setOpen(true);
            }}
            onKeyDown={onKeyDown}
            placeholder={variant === "desktop" ? "Search phones, laptops, audio..." : "Search electronics..."}
            className={cn(
              "w-full pl-10 pr-4 rounded-lg border border-input bg-muted/50 text-body-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-colors",
              variant === "desktop" ? "h-10" : "h-9",
            )}
            aria-label="Search products"
            aria-expanded={showDropdown}
            aria-autocomplete="list"
            role="combobox"
            aria-controls="header-search-results"
          />
        </div>
      </form>

      {showDropdown && (
        <div
          id="header-search-results"
          className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-border bg-card shadow-lg overflow-hidden animate-[fade-in-down_0.15s_ease-out]"
        >
          {loading && !hasResults ? (
            <div className="px-4 py-6 text-center text-caption text-muted-foreground">
              <Loader2 className="size-4 animate-spin inline mr-1.5" /> Searching…
            </div>
          ) : hasResults ? (
            <div className="max-h-[70vh] overflow-y-auto py-1">
              {/* Categories */}
              {data.categories.length > 0 && (
                <div className="py-1">
                  <p className="px-3 pt-1 pb-0.5 text-micro font-semibold uppercase tracking-wide text-muted-foreground">
                    Categories
                  </p>
                  {data.categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => navigate(`/category/${c.slug}`)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left text-body-sm hover:bg-muted transition-colors"
                    >
                      <Layers className="size-4 text-muted-foreground flex-shrink-0" />
                      <span className="line-clamp-1">{c.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Brands */}
              {data.brands.length > 0 && (
                <div className="py-1 border-t border-border">
                  <p className="px-3 pt-1 pb-0.5 text-micro font-semibold uppercase tracking-wide text-muted-foreground">
                    Brands
                  </p>
                  {data.brands.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => navigate(`/products?brand=${encodeURIComponent(b.name)}`)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left text-body-sm hover:bg-muted transition-colors"
                    >
                      <Tag className="size-4 text-muted-foreground flex-shrink-0" />
                      <span className="line-clamp-1">{b.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Products */}
              {products.length > 0 && (
                <div className="py-1 border-t border-border">
                  <p className="px-3 pt-1 pb-0.5 text-micro font-semibold uppercase tracking-wide text-muted-foreground">
                    Products
                  </p>
                  {products.map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => navigate(`/products/${s.slug}`)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
                        i === active ? "bg-muted" : "hover:bg-muted",
                      )}
                    >
                      <span className="size-10 flex-shrink-0 rounded-lg overflow-hidden border border-border bg-muted">
                        {s.images[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.images[0]} alt="" className="h-full w-full object-cover" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-body-sm font-medium line-clamp-1">{s.name}</span>
                        <span className="block text-caption text-primary font-semibold">
                          ₦{s.price.toLocaleString("en-NG")}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div className="border-t border-border">
                <button
                  type="button"
                  onClick={() => goToSearch()}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-body-sm font-medium text-primary hover:bg-muted transition-colors"
                >
                  <Search className="size-4" /> See all results for &ldquo;{q.trim()}&rdquo;
                </button>
              </div>
            </div>
          ) : (
            <div className="px-4 py-6 text-center text-caption text-muted-foreground">
              No matches for &ldquo;{q.trim()}&rdquo;. Press Enter to search anyway.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
