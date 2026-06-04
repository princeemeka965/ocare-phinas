"use client";

import { useState } from "react";
import type { ReactNode } from "react";

/**
 * Renders a category's product image, falling back to a provided node (its
 * lucide icon) when the image is missing or fails to load. This keeps tiles
 * looking intentional before the real `/categories/*` artwork has been added.
 *
 * `fallback` is a pre-rendered element rather than a component type, so it can
 * safely be passed from a Server Component across the client boundary.
 */
export function CategoryImage({
  src,
  alt,
  fallback,
  imgClassName,
}: {
  src?: string;
  alt: string;
  fallback: ReactNode;
  imgClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={imgClassName}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  return <>{fallback}</>;
}
