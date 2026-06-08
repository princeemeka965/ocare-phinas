"use client";

import { useEffect } from "react";

import { ConnectionError } from "@/components/connection-error";

/**
 * Root error boundary — the catch-all for any segment without its own
 * `error.tsx` (e.g. the admin dashboard). Renders inside the root layout, so a
 * database/connection failure during render shows a friendly retry page rather
 * than a raw server error.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application render error:", error);
  }, [error]);

  return <ConnectionError onRetry={reset} />;
}
