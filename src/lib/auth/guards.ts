import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabase";
import { hasPermission, type AdminAccount, type AdminPermission } from "@/lib/admin-access";
import type { AdminPermissionGrant, Customer } from "@/lib/db/types";
import { ADMIN_COOKIE, CUSTOMER_COOKIE, verifySession } from "./session";

/* ------------------------------------------------------------------ *
 * Request guards — read the session cookie, load the user, enforce     *
 * blocked/disabled, and (for admins) area permissions.                 *
 * ------------------------------------------------------------------ */

async function sessionId(cookieName: string, kind: "customer" | "admin"): Promise<string | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  const payload = await verifySession(token);
  if (!payload || payload.kind !== kind) return null;
  return payload.sub;
}

/** The signed-in customer, or null (also null if blocked). */
export async function currentCustomer() {
  const id = await sessionId(CUSTOMER_COOKIE, "customer");
  if (!id) return null;
  const { data: customer } = await supabase.from("Customer").select("*").eq("id", id).maybeSingle<Customer>();
  if (!customer || customer.blocked) return null;
  return customer;
}

export type CurrentAdmin = {
  id: string;
  name: string;
  email: string;
  role: "super" | "sub";
  permissions: AdminPermission[];
};

/** The signed-in admin with permissions, or null (also null if disabled). */
export async function currentAdmin(): Promise<CurrentAdmin | null> {
  const id = await sessionId(ADMIN_COOKIE, "admin");
  if (!id) return null;
  const { data: admin } = await supabase
    .from("AdminUser")
    .select("*, permissions:AdminPermissionGrant(permission)")
    .eq("id", id)
    .maybeSingle<{
      id: string;
      name: string;
      email: string;
      role: "super" | "sub";
      disabled: boolean;
      permissions: Pick<AdminPermissionGrant, "permission">[];
    }>();
  if (!admin || admin.disabled) return null;
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    permissions: admin.permissions.map((p) => p.permission as AdminPermission),
  };
}

/** Whether an admin may access an area (super = all). */
export function adminCan(admin: CurrentAdmin, perm: AdminPermission): boolean {
  const account: AdminAccount = { id: admin.id, name: admin.name, email: admin.email, role: admin.role, permissions: admin.permissions };
  return hasPermission(account, perm);
}

/* JSON response helpers ------------------------------------------------ */

export function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export const unauthorized = () => jsonError(401, "Not authenticated.");
export const forbidden = (perm?: AdminPermission) =>
  jsonError(403, perm ? `You don't have the "${perm}" permission.` : "Forbidden.");

/**
 * Guard an admin route. Returns the admin, or a ready-to-return error response.
 * Usage:
 *   const gate = await requireAdmin("orders");
 *   if ("response" in gate) return gate.response;
 *   const { admin } = gate;
 */
export async function requireAdmin(
  perm?: AdminPermission,
): Promise<{ admin: CurrentAdmin } | { response: NextResponse }> {
  const admin = await currentAdmin();
  if (!admin) return { response: unauthorized() };
  if (perm && !adminCan(admin, perm)) return { response: forbidden(perm) };
  return { admin };
}

/** Guard a customer route. */
export async function requireCustomer(): Promise<
  { customer: NonNullable<Awaited<ReturnType<typeof currentCustomer>>> } | { response: NextResponse }
> {
  const customer = await currentCustomer();
  if (!customer) return { response: unauthorized() };
  return { customer };
}
