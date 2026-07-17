import { create } from "zustand";

import type { AdminAccount, AdminPermission } from "@/lib/admin-access";

/* ------------------------------------------------------------------ *
 * Admin session + sub-admin preview                                    *
 * ------------------------------------------------------------------ *
 * `current` is the admin acting now (may be a preview); `realAdmin` is   *
 * the actual signed-in admin (so a preview can be exited). The session   *
 * is hydrated from GET /api/admin/me and set on login. Sub-admin CRUD    *
 * itself lives on the Team page, wired to /api/admin/team.               *
 * ------------------------------------------------------------------ */

export interface SubAdmin {
  id: string;
  name: string;
  email: string;
  permissions: AdminPermission[];
  createdAt: string;
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

  previewAs: (sub) =>
    set(() => ({
      previewing: true,
      current: { id: sub.id, name: sub.name, email: sub.email, role: "sub", permissions: sub.permissions },
    })),

  exitPreview: () => set((s) => ({ previewing: false, current: s.realAdmin })),
}));
