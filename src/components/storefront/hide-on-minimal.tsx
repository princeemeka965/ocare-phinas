"use client";

import { usePathname } from "next/navigation";

import { isMinimalChrome } from "@/lib/chrome-routes";

/**
 * Hides its children on minimal-chrome routes (auth screens, PSS join/solo
 * flows). Server components can be passed through as children.
 */
export function HideOnMinimal({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (isMinimalChrome(pathname)) return null;
  return <>{children}</>;
}
