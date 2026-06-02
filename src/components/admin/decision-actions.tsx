"use client";

import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { toast } from "@/store/toastStore";

export type Decision = "awaiting" | "confirmed" | "rejected";

/**
 * Confirm / reject control for manual-payment verification (order payments
 * and plan contributions). Proof is a WhatsApp screenshot — there's nothing
 * for the system to validate automatically, so this is a human decision.
 */
export function DecisionActions({
  reference,
  initialStatus,
  confirmToast,
  rejectToast,
  confirmLabel = "Confirm",
  rejectLabel = "Reject",
  note,
}: {
  reference: string;
  initialStatus: Decision;
  confirmToast: string;
  rejectToast: string;
  confirmLabel?: string;
  rejectLabel?: string;
  note?: string;
}) {
  const [status, setStatus] = useState<Decision>(initialStatus);
  const [busy, setBusy] = useState<null | "confirmed" | "rejected">(null);

  async function decide(next: "confirmed" | "rejected") {
    setBusy(next);
    // Phase 3: POST the decision; confirming an order payment decrements stock,
    // confirming a contribution advances the plan and updates the ledger.
    await new Promise((r) => setTimeout(r, 700));
    setStatus(next);
    setBusy(null);
    if (next === "confirmed") toast.success(confirmToast, "Confirmed");
    else toast.info(rejectToast, "Rejected");
  }

  if (status !== "awaiting") {
    const confirmed = status === "confirmed";
    return (
      <div className={cn(
        "flex items-center gap-2.5 rounded-xl border px-4 py-3",
        confirmed ? "border-success/40 bg-success/5" : "border-destructive/40 bg-destructive/5",
      )}>
        {confirmed ? <CheckCircle className="size-5 text-success" /> : <XCircle className="size-5 text-destructive" />}
        <p className="text-body-sm font-medium">
          {reference} was {confirmed ? "confirmed" : "rejected"}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => decide("confirmed")}
          disabled={busy !== null}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-success text-white font-semibold text-body-sm hover:bg-success/90 transition-colors disabled:opacity-60"
        >
          <CheckCircle className="size-4" /> {busy === "confirmed" ? "Confirming…" : confirmLabel}
        </button>
        <button
          onClick={() => decide("rejected")}
          disabled={busy !== null}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-destructive/30 text-destructive font-semibold text-body-sm hover:bg-destructive/10 transition-colors disabled:opacity-60"
        >
          <XCircle className="size-4" /> {busy === "rejected" ? "Rejecting…" : rejectLabel}
        </button>
      </div>
      {note && <p className="text-caption text-muted-foreground">{note}</p>}
    </div>
  );
}
