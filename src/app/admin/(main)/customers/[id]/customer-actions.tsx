"use client";

import { useState } from "react";
import { Ban, CheckCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toastStore";

export function CustomerBlockControl({ name, initialBlocked }: { name: string; initialBlocked: boolean }) {
  const [blocked, setBlocked] = useState(initialBlocked);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const next = !blocked;
    // Phase 3: PATCH /api/admin/customers/:id { blocked: next }
    await new Promise((r) => setTimeout(r, 500));
    setBlocked(next);
    setBusy(false);
    if (next) toast.info(`${name} has been blocked.`, "Customer blocked");
    else toast.success(`${name} has been unblocked.`, "Customer unblocked");
  }

  return (
    <div className="flex items-center gap-3">
      {blocked && <Badge variant="destructive" className="text-micro">Blocked</Badge>}
      <button
        onClick={toggle}
        disabled={busy}
        className={cn(
          "inline-flex items-center gap-2 h-9 px-4 rounded-lg text-body-sm font-semibold transition-colors disabled:opacity-60",
          blocked
            ? "border border-success/30 text-success hover:bg-success/10"
            : "border border-destructive/30 text-destructive hover:bg-destructive/10",
        )}
      >
        {blocked ? <><CheckCircle className="size-4" /> {busy ? "Unblocking…" : "Unblock customer"}</> : <><Ban className="size-4" /> {busy ? "Blocking…" : "Block customer"}</>}
      </button>
    </div>
  );
}
