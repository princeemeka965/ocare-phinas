/* ------------------------------------------------------------------ *
 * Catalog filter plumbing shared by the server pages and the client   *
 * filter components — pure values only, no React.                      *
 * ------------------------------------------------------------------ */

export type CatalogFilterParams = Record<string, string | undefined>;

/** id of the results grid — the scroll target after a filter changes on mobile. */
export const RESULTS_ID = "product-results";

export const SORTS = [
  { value: "", label: "Newest" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
];

/** Build an href to `basePath` with `changes` merged into the current filters.
   The current page is dropped unless `changes` sets one, so changing any filter
   resets back to page 1 while pagination links keep their target page. */
export function buildFilterHref(
  basePath: string,
  current: CatalogFilterParams,
  changes: CatalogFilterParams = {},
): string {
  const carried = { ...current };
  delete carried.page;
  const merged: Record<string, string> = {};
  for (const [k, v] of Object.entries({ ...carried, ...changes })) {
    if (v) merged[k] = v;
  }
  const qs = new URLSearchParams(merged).toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
