"use client";

import { usePathname } from "next/navigation";

import { hidesFooterWhenAuthed, isMinimalChrome } from "@/lib/chrome-routes";
import { useUserStore } from "@/store/userStore";

/**
 * Gates the storefront footer. Hides it on minimal-chrome routes (auth / PSS
 * flows) as before, and additionally hides it for signed-in users on focused
 * account/transactional routes (cart, checkout, orders, payment). The footer
 * (a server component) is passed through as children.
 */
export function FooterGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useUserStore((s) => s.user);

  if (isMinimalChrome(pathname)) return null;
  if (user && hidesFooterWhenAuthed(pathname)) return null;
  return <>{children}</>;
}
