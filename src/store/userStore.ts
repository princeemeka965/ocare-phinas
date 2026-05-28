import { create } from "zustand";
import type { User } from "@/types/user";

interface UserStore {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (fields: Partial<User>) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>()((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  updateUser: (fields) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...fields } : null,
    })),
  clearUser: () => set({ user: null }),
}));
