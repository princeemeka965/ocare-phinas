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
];

export function isMinimalChrome(pathname: string): boolean {
  return MINIMAL_CHROME_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
