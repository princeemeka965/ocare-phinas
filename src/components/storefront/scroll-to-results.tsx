"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

/**
 * After a filter / sort / page change, bring the results grid into view on
 * mobile — there the filter controls sit above the grid, so without this the
 * customer stays parked on the filters and never sees the response. Desktop
 * (lg+) keeps its scroll position: the sidebar sits beside the grid.
 */
export function ScrollToResults({ targetId }: { targetId: string }) {
  const searchParams = useSearchParams();
  const key = searchParams.toString();
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (lastKey.current === null || lastKey.current === key) {
      lastKey.current = key;
      return;
    }
    lastKey.current = key;
    if (window.matchMedia("(min-width: 1024px)").matches) return;
    document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [key, targetId]);

  return null;
}
