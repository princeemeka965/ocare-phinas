"use client";

import { useEffect } from "react";

import { useTheme } from "@/hooks/useTheme";
import { ToastContainer } from "@/components/ui/toast";
import { useUserStore } from "@/store/userStore";
import { api } from "@/lib/api";

export function Providers({ children }: { children: React.ReactNode }) {
  useTheme();
  const setUser = useUserStore((s) => s.setUser);

  /* Restore the customer session from the cookie on load. */
  useEffect(() => {
    let active = true;
    api
      .get<{ customer: { id: string; name: string; email: string } | null }>("/api/auth/me")
      .then((d) => { if (active && d.customer) setUser({ id: d.customer.id, email: d.customer.email, name: d.customer.name }); })
      .catch(() => {});
    return () => { active = false; };
  }, [setUser]);

  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
}
