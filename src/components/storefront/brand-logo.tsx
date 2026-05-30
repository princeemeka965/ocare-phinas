"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Renders a brand's logo, falling back to its initials when no logo is
 * available or the image fails to load.
 *
 * Logos are served from the Simple Icons CDN (https://simpleicons.org) using
 * each brand's `logoSlug`. For production, consider self-hosting the SVGs to
 * avoid a third-party dependency and to cover brands Simple Icons doesn't have.
 */
export function BrandLogo({
  name,
  logoSlug,
  imgClassName,
  textClassName,
  logoUrl,
  invertOnDark,
}: {
  name: string;
  logoSlug?: string;
  imgClassName?: string;
  textClassName?: string;
  logoUrl?: string;
  /** Invert the logo in dark mode — for single-color (black) logos that need to flip to white. */
  invertOnDark?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if ((logoSlug || logoUrl) && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl || `https://cdn.simpleicons.org/${logoSlug}`}
        alt={`${name} logo`}
        className={cn("object-contain", invertOnDark && "dark:invert", imgClassName)}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span className={textClassName} aria-hidden>
      {name.slice(0, 2)}
    </span>
  );
}
