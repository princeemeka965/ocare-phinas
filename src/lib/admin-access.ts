/* ------------------------------------------------------------------ *
 * Admin access control — roles, permissions & sub-admins               *
 * ------------------------------------------------------------------ *
 * The super admin creates sub-admins and grants them a set of area      *
 * permissions. A sub-admin only sees and can act on the areas they are  *
 * granted — everything else is hidden from the sidebar AND blocked at    *
 * the route. Super admins implicitly have every permission.             *
 *                                                                       *
 * IMPORTANT (integration): the UI gating here is convenience only.      *
 * Phase 3 MUST enforce every permission server-side on each admin       *
 * endpoint (never trust hidden UI). See payment-flow §15.               *
 * ------------------------------------------------------------------ */

import {
  LayoutDashboard, Package, Tag, ShoppingBag, Users, GitFork,
  AlertTriangle, Settings, ShieldCheck, Sun, BarChart3, type LucideIcon,
} from "lucide-react";

/** One grantable area of the admin. */
export type AdminPermission =
  | "dashboard"
  | "products"
  | "categories"
  | "orders"
  | "customers"
  | "groups"
  | "arrears"
  | "solar"
  | "settings"
  | "team"
  | "reports";

export interface PermissionMeta {
  label: string;
  description: string;
  icon: LucideIcon;
}

export const PERMISSION_META: Record<AdminPermission, PermissionMeta> = {
  dashboard: { label: "Dashboard", description: "View the overview dashboard", icon: LayoutDashboard },
  products: { label: "Products", description: "Create, edit and manage products", icon: Package },
  categories: { label: "Categories & Brands", description: "Manage categories and brands", icon: Tag },
  orders: { label: "Orders", description: "View orders and confirm payments", icon: ShoppingBag },
  customers: { label: "Customers", description: "View customers, block / unblock", icon: Users },
  groups: { label: "Groups", description: "Manage Pay Small Small groups", icon: GitFork },
  arrears: { label: "Arrears", description: "View missed & overdue payments", icon: AlertTriangle },
  solar: { label: "Solar Plans", description: "Review KYC applications, deposits and installations", icon: Sun },
  settings: { label: "Settings", description: "Edit store settings", icon: Settings },
  team: { label: "Team & permissions", description: "Add sub-admins and assign privileges", icon: ShieldCheck },
  reports: { label: "Reports", description: "Revenue, outstanding payments and wallet totals", icon: BarChart3 },
};

/** All permissions, in display order. */
export const ADMIN_PERMISSIONS = Object.keys(PERMISSION_META) as AdminPermission[];

/**
 * Permissions a super admin may grant to a sub-admin. "team" and "reports"
 * are excluded — only the super admin manages the team and sees reports.
 */
export const ASSIGNABLE_PERMISSIONS = ADMIN_PERMISSIONS.filter((p) => p !== "team" && p !== "reports");

export type AdminRole = "super" | "sub";

export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  /** Explicit grants for sub-admins. Super admins implicitly have all. */
  permissions: AdminPermission[];
}

/** Super admins can do everything; sub-admins only their granted areas. */
export function hasPermission(admin: AdminAccount, perm: AdminPermission): boolean {
  return admin.role === "super" || admin.permissions.includes(perm);
}

/** The admin route each permission's area lives at. */
export const ROUTE_FOR_PERMISSION: Record<AdminPermission, string> = {
  dashboard: "/admin/dashboard",
  products: "/admin/products",
  categories: "/admin/categories",
  orders: "/admin/orders",
  customers: "/admin/customers",
  groups: "/admin/groups",
  arrears: "/admin/arrears",
  solar: "/admin/solar",
  settings: "/admin/settings",
  team: "/admin/team",
  reports: "/admin/reports",
};

/** Where to send an admin after sign-in: the dashboard if allowed, else their first granted area. */
export function landingRoute(admin: AdminAccount): string {
  if (hasPermission(admin, "dashboard")) return ROUTE_FOR_PERMISSION.dashboard;
  const first = ADMIN_PERMISSIONS.find((p) => hasPermission(admin, p));
  return first ? ROUTE_FOR_PERMISSION[first] : ROUTE_FOR_PERMISSION.dashboard;
}

/** The permission that gates a given admin route, or null if unguarded. */
export function permissionForPath(pathname: string): AdminPermission | null {
  const map: { prefix: string; perm: AdminPermission }[] = [
    { prefix: "/admin/dashboard", perm: "dashboard" },
    { prefix: "/admin/products", perm: "products" },
    { prefix: "/admin/categories", perm: "categories" },
    { prefix: "/admin/orders", perm: "orders" },
    { prefix: "/admin/customers", perm: "customers" },
    { prefix: "/admin/groups", perm: "groups" },
    { prefix: "/admin/arrears", perm: "arrears" },
    { prefix: "/admin/solar", perm: "solar" },
    { prefix: "/admin/team", perm: "team" },
    { prefix: "/admin/settings", perm: "settings" },
    { prefix: "/admin/reports", perm: "reports" },
  ];
  const match = map.find((m) => pathname === m.prefix || pathname.startsWith(`${m.prefix}/`));
  return match ? match.perm : null;
}
