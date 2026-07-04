/**
 * Routes that should render with minimal storefront chrome — no primary nav
 * strip, no category strip, and no footer. Covers authentication screens and
 * the focused Pay Small Small flows (joining a group / creating a plan).
 */
export const MINIMAL_CHROME_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/pay-small-small/join",
  "/pay-small-small/solo",
  "/solar/apply",
];

export function isMinimalChrome(pathname: string): boolean {
  return MINIMAL_CHROME_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

/**
 * Routes where the marketing footer is hidden for signed-in users — focused
 * account / transactional flows (cart, checkout, and order tracking + payment)
 * where the footer is noise. Covers /orders, /orders/[id] and the payment page.
 */
export const AUTHED_FOOTERLESS_ROUTES = ["/cart", "/checkout", "/orders"];

export function hidesFooterWhenAuthed(pathname: string): boolean {
  return AUTHED_FOOTERLESS_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
