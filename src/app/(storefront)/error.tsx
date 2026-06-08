"use client";

import { useEffect } from "react";

import { ConnectionError } from "@/components/connection-error";

/**
 * Error boundary for the storefront. Most failures here are a data fetch that
 * couldn't reach the database (e.g. the connection dropped), which would
 * otherwise surface as a raw Prisma/server error. We log the real error for
 * debugging and show the customer a calm "trouble connecting" page with retry.
 */
export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Storefront render error:", error);
  }, [error]);

  return (
    <ConnectionError
      title="We couldn't load this page"
      message="This is usually a temporary connection problem reaching our servers. Please check your internet and try again."
      onRetry={reset}
    />
  );
}
