"use client";

import { useTheme } from "@/hooks/useTheme";
import { ToastContainer } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  useTheme();
  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
}
