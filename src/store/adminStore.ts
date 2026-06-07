import { create } from "zustand";

import type { AdminAccount, AdminPermission } from "@/lib/admin-access";

/* ------------------------------------------------------------------ *
 * Admin session + sub-admin management                                 *
 * ------------------------------------------------------------------ *
 * `current` is the admin acting now (may be a preview); `realAdmin` is   *
 * the actual signed-in admin (so a preview can be exited). The session   *
 * is hydrated from GET /api/admin/me and set on login. Sub-admin CRUD    *
 * still uses the mock list here until the Team page is wired to the API. *
 * ------------------------------------------------------------------ */

export interface SubAdmin {
  id: string;
  name: string;
  email: string;
  permissions: AdminPermission[];
  createdAt: string;
}

const MOCK_SUB_ADMINS: SubAdmin[] = [
  { id: "sub-1", name: "Ifeoma Okeke", email: "ifeoma@ocarephinas.com", permissions: ["orders", "arrears", "customers"], createdAt: "2026-05-12" },
  { id: "sub-2", name: "Tunde Bello", email: "tunde@ocarephinas.com", permissions: ["products", "categories"], createdAt: "2026-05-20" },
];

export interface NewSubAdmin {
  name: string;
  email: string;
  permissions: AdminPermission[];
}

export type AdminAuthStatus = "loading" | "authed" | "guest";

interface AdminStore {
  status: AdminAuthStatus;
  /** The admin whose view is currently rendered (null until authed). */
  current: AdminAccount | null;
  /** The real signed-in admin — used to exit a preview. */
  realAdmin: AdminAccount | null;
  previewing: boolean;

  setSession: (admin: AdminAccount) => void;
  clearSession: () => void;

  subAdmins: SubAdmin[];
  addSubAdmin: (input: NewSubAdmin) => void;
  updateSubAdmin: (id: string, fields: Partial<Omit<SubAdmin, "id" | "createdAt">>) => void;
  togglePermission: (id: string, perm: AdminPermission) => void;
  removeSubAdmin: (id: string) => void;

  previewAs: (sub: SubAdmin) => void;
  exitPreview: () => void;
}

export const useAdminStore = create<AdminStore>()((set) => ({
  status: "loading",
  current: null,
  realAdmin: null,
  previewing: false,

  setSession: (admin) => set({ status: "authed", current: admin, realAdmin: admin, previewing: false }),
  clearSession: () => set({ status: "guest", current: null, realAdmin: null, previewing: false }),

  subAdmins: MOCK_SUB_ADMINS,

  addSubAdmin: (input) =>
    set((s) => ({
      subAdmins: [
        ...s.subAdmins,
        { id: `sub-${Date.now()}`, name: input.name, email: input.email, permissions: input.permissions, createdAt: new Date().toISOString().slice(0, 10) },
      ],
    })),

  updateSubAdmin: (id, fields) =>
    set((s) => ({ subAdmins: s.subAdmins.map((a) => (a.id === id ? { ...a, ...fields } : a)) })),

  togglePermission: (id, perm) =>
    set((s) => ({
      subAdmins: s.subAdmins.map((a) =>
        a.id === id
          ? { ...a, permissions: a.permissions.includes(perm) ? a.permissions.filter((p) => p !== perm) : [...a.permissions, perm] }
          : a,
      ),
    })),

  removeSubAdmin: (id) => set((s) => ({ subAdmins: s.subAdmins.filter((a) => a.id !== id) })),

  previewAs: (sub) =>
    set(() => ({
      previewing: true,
      current: { id: sub.id, name: sub.name, email: sub.email, role: "sub", permissions: sub.permissions },
    })),

  exitPreview: () => set((s) => ({ previewing: false, current: s.realAdmin })),
}));
