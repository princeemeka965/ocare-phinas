"use client";

import { usePathname, useRouter } from "next/navigation";

import { useUserStore } from "@/store/userStore";
import { toast } from "@/store/toastStore";

/**
 * The cart is a logged-in-only feature. This returns a guard to call before
 * mutating the cart: if the visitor isn't signed in it nudges them to log in
 * (carrying the current page as `?next=` so they return here afterwards) and
 * returns false so the caller can bail out before touching the cart.
 */
export function useCartGuard() {
  const user = useUserStore((s) => s.user);
  const router = useRouter();
  const pathname = usePathname();

  return function ensureLoggedIn(): boolean {
    if (user) return true;
    toast.info("Please log in to start a cart.", "Login required");
    router.push(`/login?next=${encodeURIComponent(pathname)}`);
    return false;
  };
}
