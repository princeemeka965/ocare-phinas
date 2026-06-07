"use client";

import { useState } from "react";
import { Ban, CheckCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import { toast } from "@/store/toastStore";

export function CustomerBlockControl({
  id,
  name,
  initialBlocked,
}: {
  id: string;
  name: string;
  initialBlocked: boolean;
}) {
  const [blocked, setBlocked] = useState(initialBlocked);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const next = !blocked;
    try {
      const res = await api.patch<{ blocked: boolean }>(`/api/admin/customers/${id}/block`, { blocked: next });
      setBlocked(res.blocked);
      if (res.blocked) toast.info(`${name} has been blocked.`, "Customer blocked");
      else toast.success(`${name} has been unblocked.`, "Customer unblocked");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't update this customer.");
    } finally {
      setBusy(false);
    }
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
