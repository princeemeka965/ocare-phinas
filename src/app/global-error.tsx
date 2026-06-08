"use client";

import { useEffect } from "react";

import { ConnectionError } from "@/components/connection-error";

import "./globals.css";

/**
 * Last-resort boundary for failures in the root layout itself (it replaces the
 * layout, so it must render its own <html>/<body>). Keeps the same friendly
 * "trouble connecting" page so the customer never sees a raw crash.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root layout error:", error);
  }, [error]);

  return (
    <html lang="en-NG">
      <body>
        <ConnectionError onRetry={reset} />
      </body>
    </html>
  );
}
