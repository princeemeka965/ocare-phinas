"use client";

import Link from "next/link";
import { WifiOff, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ConnectionErrorProps {
  /** Heading. */
  title?: string;
  /** Supporting copy. */
  message?: string;
  /** Retry handler — typically an error boundary's `reset`. Hidden if omitted. */
  onRetry?: () => void;
  /** Where the secondary link points. */
  homeHref?: string;
  /** Label for the secondary link. */
  homeLabel?: string;
  className?: string;
}

/**
 * A friendly, theme-aware fallback shown when we can't load data — almost always
 * a temporary network or database connection problem. It deliberately shows a
 * reassuring message and a retry/home action instead of leaking a raw Prisma or
 * server error to the customer. Used by the route `error.tsx` boundaries and any
 * client view that wants a consistent "couldn't connect" state.
 */
export function ConnectionError({
  title = "Trouble connecting",
  message = "We couldn't load this page — this is usually a temporary network or connection problem. Please check your internet and try again.",
  onRetry,
  homeHref = "/",
  homeLabel = "Go to homepage",
  className,
}: ConnectionErrorProps) {
  return (
    <div className={cn("flex min-h-[60vh] items-center justify-center px-4 py-16", className)}>
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <WifiOff className="size-8" />
        </div>
        <h1 className="text-h2 font-bold mb-2">{title}</h1>
        <p className="text-body-sm text-muted-foreground mb-7 mx-auto max-w-[42ch]">{message}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry ? (
            <Button onClick={onRetry} size="lg" className="gap-2">
              <RefreshCw className="size-4" /> Try again
            </Button>
          ) : null}
          <Link
            href={homeHref}
            className={cn(buttonVariants({ variant: onRetry ? "outline" : "default", size: "lg" }))}
          >
            {homeLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
