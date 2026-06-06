import { create } from "zustand";

import type { AdminAccount, AdminPermission } from "@/lib/admin-access";

/* ------------------------------------------------------------------ *
 * Admin session + sub-admin management (mock)                          *
 * ------------------------------------------------------------------ *
 * `current` is the admin acting right now; `realAdmin` is the actual    *
 * signed-in super admin (so a preview can be exited). Sub-admins are    *
 * created by the super admin with a set of permissions.                 *
 * Phase 3: replace with real auth — the signed-in admin's role +        *
 * permissions come from the server, and every endpoint re-checks them.  *
 * ------------------------------------------------------------------ */

export interface SubAdmin {
  id: string;
  name: string;
  email: string;
  permissions: AdminPermission[];
  createdAt: string;
}

const SUPER_ADMIN: AdminAccount = {
  id: "super-1",
  name: "Chukwuemeka Anyanwu",
  email: "anyanwue4@gmail.com",
  role: "super",
  permissions: [],
};

const MOCK_SUB_ADMINS: SubAdmin[] = [
  { id: "sub-1", name: "Ifeoma Okeke", email: "ifeoma@ocarephinas.com", permissions: ["orders", "arrears", "customers"], createdAt: "2026-05-12" },
  { id: "sub-2", name: "Tunde Bello", email: "tunde@ocarephinas.com", permissions: ["products", "categories"], createdAt: "2026-05-20" },
];

export interface NewSubAdmin {
  name: string;
  email: string;
  permissions: AdminPermission[];
}

interface AdminStore {
  /** The admin whose view is currently rendered (may be a preview). */
  current: AdminAccount;
  /** The real signed-in super admin — used to exit a preview. */
  realAdmin: AdminAccount;
  subAdmins: SubAdmin[];
  /** True while the super admin is previewing a sub-admin's restricted view. */
  previewing: boolean;

  addSubAdmin: (input: NewSubAdmin) => void;
  updateSubAdmin: (id: string, fields: Partial<Omit<SubAdmin, "id" | "createdAt">>) => void;
  togglePermission: (id: string, perm: AdminPermission) => void;
  removeSubAdmin: (id: string) => void;

  /** Mock sign-in by email — sets the acting admin. Returns the matched account or null. */
  signIn: (email: string) => AdminAccount | null;
  previewAs: (sub: SubAdmin) => void;
  exitPreview: () => void;
}

export const useAdminStore = create<AdminStore>()((set, get) => ({
  current: SUPER_ADMIN,
  realAdmin: SUPER_ADMIN,
  subAdmins: MOCK_SUB_ADMINS,
  previewing: false,

  addSubAdmin: (input) =>
    set((s) => ({
      subAdmins: [
        ...s.subAdmins,
        {
          id: `sub-${Date.now()}`,
          name: input.name,
          email: input.email,
          permissions: input.permissions,
          createdAt: new Date().toISOString().slice(0, 10),
        },
      ],
    })),

  updateSubAdmin: (id, fields) =>
    set((s) => ({
      subAdmins: s.subAdmins.map((a) => (a.id === id ? { ...a, ...fields } : a)),
    })),

  togglePermission: (id, perm) =>
    set((s) => ({
      subAdmins: s.subAdmins.map((a) =>
        a.id === id
          ? {
              ...a,
              permissions: a.permissions.includes(perm)
                ? a.permissions.filter((p) => p !== perm)
                : [...a.permissions, perm],
            }
          : a,
      ),
    })),

  removeSubAdmin: (id) =>
    set((s) => ({ subAdmins: s.subAdmins.filter((a) => a.id !== id) })),

  signIn: (email) => {
    const e = email.trim().toLowerCase();
    const { realAdmin, subAdmins } = get();
    // Phase 3: verify credentials server-side; the server returns role + permissions.
    if (e === realAdmin.email.toLowerCase()) {
      set({ current: realAdmin, previewing: false });
      return realAdmin;
    }
    const sub = subAdmins.find((s) => s.email.toLowerCase() === e);
    if (sub) {
      const account: AdminAccount = {
        id: sub.id, name: sub.name, email: sub.email, role: "sub", permissions: sub.permissions,
      };
      set({ current: account, previewing: false });
      return account;
    }
    return null;
  },

  previewAs: (sub) =>
    set(() => ({
      previewing: true,
      current: { id: sub.id, name: sub.name, email: sub.email, role: "sub", permissions: sub.permissions },
    })),

  exitPreview: () => set((s) => ({ previewing: false, current: s.realAdmin })),
}));
