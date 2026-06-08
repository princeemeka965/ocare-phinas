import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface PaginationProps {
  /** Current 1-based page. */
  page: number;
  /** Total number of pages. */
  pages: number;
  /**
   * Link mode (server components): build an href for a target page. Renders
   * `<Link>`s so pagination works without client JS and is crawlable.
   */
  hrefFor?: (page: number) => string;
  /** Button mode (client components): handle a page change. */
  onPageChange?: (page: number) => void;
  className?: string;
}

/**
 * Compact page list with first/last anchors and an ellipsis around the current
 * page, e.g. `1 … 4 5 6 … 20`.
 */
function pageWindow(current: number, total: number): (number | "ellipsis")[] {
  const around = new Set<number>([1, total, current - 1, current, current + 1]);
  const sorted = [...around].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const n of sorted) {
    if (prev && n - prev > 1) out.push("ellipsis");
    out.push(n);
    prev = n;
  }
  return out;
}

const cellBase =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-body-sm font-medium transition-colors";

/**
 * Shared pagination control. Pass `hrefFor` for link-based pagination in server
 * components, or `onPageChange` for button-based pagination in client views.
 * Renders nothing when there's a single page.
 */
export function Pagination({ page, pages, hrefFor, onPageChange, className }: PaginationProps) {
  if (pages <= 1) return null;

  const items = pageWindow(page, pages);
  const prevDisabled = page <= 1;
  const nextDisabled = page >= pages;

  /* A single cell — link, active page, or interactive button. */
  function cell(target: number, content: React.ReactNode, opts: { active?: boolean; disabled?: boolean; label?: string } = {}) {
    const { active, disabled, label } = opts;
    const className = cn(
      cellBase,
      active
        ? "border-primary bg-primary text-primary-foreground"
        : disabled
          ? "border-border text-muted-foreground/50 cursor-not-allowed"
          : "border-border text-foreground hover:bg-muted",
    );

    if (disabled) {
      return (
        <span key={label ?? target} className={className} aria-disabled="true" aria-label={label}>
          {content}
        </span>
      );
    }
    if (hrefFor) {
      return (
        <Link
          key={label ?? target}
          href={hrefFor(target)}
          className={className}
          aria-label={label}
          aria-current={active ? "page" : undefined}
        >
          {content}
        </Link>
      );
    }
    return (
      <button
        key={label ?? target}
        type="button"
        onClick={() => onPageChange?.(target)}
        className={className}
        aria-label={label}
        aria-current={active ? "page" : undefined}
      >
        {content}
      </button>
    );
  }

  return (
    <nav className={cn("flex items-center justify-center gap-1.5", className)} aria-label="Pagination">
      {cell(page - 1, <ChevronLeft className="size-4" />, { disabled: prevDisabled, label: "Previous page" })}

      {items.map((item, i) =>
        item === "ellipsis" ? (
          <span key={`e${i}`} className="px-1 text-muted-foreground select-none">
            …
          </span>
        ) : (
          cell(item, item, { active: item === page, label: `Page ${item}` })
        ),
      )}

      {cell(page + 1, <ChevronRight className="size-4" />, { disabled: nextDisabled, label: "Next page" })}
    </nav>
  );
}
