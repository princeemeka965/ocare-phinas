import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { RESULTS_ID, type CatalogFilterParams } from "./catalog-filter-utils";

/* ------------------------------------------------------------------ *
 * Catalog filter UI — shared by /products and /category/[slug].        *
 * Server-rendered pieces live here; the interactive links, pending     *
 * overlay and nav provider live in catalog-filters-client.tsx. Both    *
 * halves are re-exported below so pages import from one place.         *
 * ------------------------------------------------------------------ */

export * from "./catalog-filter-utils";
export {
  CatalogNavProvider,
  CatalogNavLink,
  CatalogResults,
  FilterChip,
  FilterLink,
  SortLinks,
} from "./catalog-filters-client";

export function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-body-sm font-semibold mb-3">{title}</h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

/* Mobile collapsible filter. `name` makes the groups mutually exclusive —
   opening one closes the others. Closed by default, so no content shows until tapped. */
export function MobileFilterGroup({
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

/** Min/max price filter. A GET form replaces the query string with its fields,
   so the other active filters ride along as hidden inputs. The hash survives
   the round trip, landing the browser on the results grid. */
export function PriceRangeForm({
  basePath,
  filters,
}: {
  basePath: string;
  filters: CatalogFilterParams;
}) {
  const carried = Object.entries(filters).filter(
    ([k, v]) => v && !["minPrice", "maxPrice", "page"].includes(k),
  );
  const inputClass =
    "w-full h-9 px-3 rounded-lg border border-input bg-background text-body-sm focus:outline-none focus:ring-2 focus:ring-ring/40";
  return (
    <form action={`${basePath}#${RESULTS_ID}`} method="get">
      {carried.map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <h3 className="text-body-sm font-semibold mb-3">Price Range (₦)</h3>
      <div className="flex gap-2 items-center">
        <input
          type="number"
          name="minPrice"
          min={0}
          defaultValue={filters.minPrice}
          placeholder="Min"
          aria-label="Minimum price"
          className={inputClass}
        />
        <span className="text-muted-foreground flex-shrink-0">–</span>
        <input
          type="number"
          name="maxPrice"
          min={0}
          defaultValue={filters.maxPrice}
          placeholder="Max"
          aria-label="Maximum price"
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        className="mt-2 w-full h-9 rounded-lg border border-border text-body-sm font-medium hover:bg-muted transition-colors"
      >
        Apply
      </button>
    </form>
  );
}
