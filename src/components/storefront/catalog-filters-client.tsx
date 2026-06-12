"use client";

import { createContext, useContext, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpDown, X, Check, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { buildFilterHref, RESULTS_ID, SORTS, type CatalogFilterParams } from "./catalog-filter-utils";

/* ------------------------------------------------------------------ *
 * Client side of the catalog filters. Filter taps navigate inside a    *
 * React transition: on mobile the grid is scrolled into view at once,  *
 * the old results dim behind a loading pill, and the fresh data swaps  *
 * in when the server responds.                                         *
 * ------------------------------------------------------------------ */

interface CatalogNav {
  pending: boolean;
  navigate: (href: string) => void;
}

const NavContext = createContext<CatalogNav | null>(null);

/** Wrap the filter sidebar + results area so they share the pending state. */
export function CatalogNavProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function navigate(href: string) {
    /* Mobile: jump to the results right away — the loading overlay plays
       there while the server responds. Desktop keeps its scroll position. */
    if (!window.matchMedia("(min-width: 64rem)").matches) {
      document.getElementById(RESULTS_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    startTransition(() => router.push(href, { scroll: false }));
  }

  return <NavContext.Provider value={{ pending, navigate }}>{children}</NavContext.Provider>;
}

/** Intercept plain left-clicks; new-tab clicks keep native link behavior. */
function useNavClick(href: string) {
  const nav = useContext(NavContext);
  return (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!nav || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    nav.navigate(href);
  };
}

/** Results wrapper — dims the previous results while a filter navigation is in flight. */
export function CatalogResults({ children }: { children: ReactNode }) {
  const pending = useContext(NavContext)?.pending ?? false;
  return (
    <div id={RESULTS_ID} className="relative scroll-mt-24">
      <div
        aria-busy={pending}
        className={cn("transition-opacity duration-200", pending && "opacity-40 pointer-events-none")}
      >
        {children}
      </div>
      {pending && (
        <div className="absolute inset-x-0 top-0 flex justify-center pt-20">
          <div className="flex items-center gap-2 rounded-full border border-border bg-background/95 px-4 py-2 shadow-md text-body-sm font-medium">
            <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
            Updating results…
          </div>
        </div>
      )}
    </div>
  );
}

/** Unstyled-beyond-className nav link for things like "Clear all". */
export function CatalogNavLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const onClick = useNavClick(href);
  return (
    <Link href={href} scroll={false} onClick={onClick} className={className}>
      {children}
    </Link>
  );
}

/** Active-filter chip — clicking it removes that filter. */
export function FilterChip({ label, href }: { label: string; href: string }) {
  const onClick = useNavClick(href);
  return (
    <Link
      href={href}
      scroll={false}
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/30 bg-primary/10 text-caption text-primary font-medium hover:bg-primary/15 transition-colors"
    >
      {label}
      <X className="size-3" aria-hidden />
      <span className="sr-only">Remove filter</span>
    </Link>
  );
}

/** The "Newest / Price ↑ / Price ↓" sort pills. */
export function SortLinks({
  basePath,
  filters,
}: {
  basePath: string;
  filters: CatalogFilterParams;
}) {
  return (
    <div className="ml-auto flex items-center gap-2">
      <ArrowUpDown className="size-4 text-muted-foreground" aria-hidden />
      <div className="flex items-center gap-1">
        {SORTS.map((s) => {
          const active = (filters.sort ?? "") === s.value;
          return (
            <SortLink
              key={s.value || "newest"}
              href={buildFilterHref(basePath, filters, { sort: s.value || undefined })}
              active={active}
              label={s.label}
            />
          );
        })}
      </div>
    </div>
  );
}

function SortLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  const onClick = useNavClick(href);
  return (
    <Link
      href={href}
      scroll={false}
      onClick={onClick}
      className={cn(
        "text-caption px-2.5 py-1.5 rounded-md transition-colors",
        active
          ? "bg-primary/10 text-primary font-semibold"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
      aria-current={active ? "true" : undefined}
    >
      {label}
    </Link>
  );
}

export function FilterLink({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  const onClick = useNavClick(href);
  return (
    <Link
      href={href}
      scroll={false}
      onClick={onClick}
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
