"use client";

import { useEffect, useState } from "react";

import { api } from "@/lib/api";

export interface BankSettings {
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  whatsappNumber: string;
}

/** Bank transfer + WhatsApp details for manual payment flows (Settings-sourced, read-only). */
export function useBankSettings(): BankSettings | null {
  const [settings, setSettings] = useState<BankSettings | null>(null);

  useEffect(() => {
    api
      .get<{ settings: BankSettings }>("/api/settings")
      .then((d) => setSettings(d.settings))
      .catch(() => {});
  }, []);

  return settings;
}
