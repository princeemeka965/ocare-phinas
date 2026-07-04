"use client";

import { MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { naira } from "@/lib/pay-small-small";
import { waHref } from "@/lib/whatsapp";
import type { BankSettings } from "@/hooks/useBankSettings";

/**
 * Shared "manual bank transfer" card for Solar's one-off payments
 * (registration fee, deposit) — bank details + WhatsApp deep link + a
 * "I've sent this payment" confirm button, matching the WhatsApp-first
 * payment pattern used across Pay Small Small (A10/A11).
 */
export function BankTransferCard({
  amount,
  narration,
  settings,
  waMessage,
  confirmLabel,
  confirming,
  onConfirm,
}: {
  amount: number;
  narration: string;
  settings: BankSettings | null;
  waMessage: string;
  confirmLabel: string;
  confirming: boolean;
  onConfirm: () => void;
}) {
  const rows = [
    { label: "Bank", value: settings?.bankName || "—" },
    { label: "Account name", value: settings?.bankAccountName || "—" },
    { label: "Account number", value: settings?.bankAccountNumber || "—" },
    { label: "Amount", value: naira(amount) },
  ];

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-4">
      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3 px-4 py-3 text-body-sm">
            <span className="text-muted-foreground">{r.label}</span>
            <span className="font-semibold font-mono text-right">{r.value}</span>
          </div>
        ))}
      </div>
      <p className="text-caption text-muted-foreground">
        Use <span className="font-mono font-medium text-foreground">{narration}</span> as your transfer
        narration, then send your screenshot on WhatsApp.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href={waHref(settings?.whatsappNumber, waMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#1eb85a] text-white font-semibold text-body-sm px-4 py-2.5 transition-colors"
        >
          <MessageCircle className="size-4" /> Send screenshot on WhatsApp
        </a>
        <Button onClick={onConfirm} disabled={confirming} className="flex-1">
          {confirming ? "Confirming…" : confirmLabel}
        </Button>
      </div>
    </div>
  );
}
