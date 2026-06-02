"use client";

import { useState } from "react";
import Link from "next/link";
import { RefreshCw, ShoppingCart, CheckCircle2 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { naira } from "@/lib/pay-small-small";
import { toast } from "@/store/toastStore";

/**
 * Completed-cycle prompt. "Continue another cycle" rolls the customer's slot
 * straight into a fresh cycle in-app (no WhatsApp) — the slot and position are
 * retained. "Convert to a product" sends them to the catalogue. No cash-out.
 */
export function CycleCompletePrompt({ reference, amountAllocated }: { reference: string; amountAllocated: number }) {
  const [continued, setContinued] = useState(false);
  const [busy, setBusy] = useState(false);

  async function continueCycle() {
    setBusy(true);
    // Phase 3: POST /api/plans/:ref/continue — rolls the slot into a new cycle, retaining the slot/position.
    await new Promise((r) => setTimeout(r, 700));
    setBusy(false);
    setContinued(true);
    toast.success(`${reference} rolled into a new cycle — your slot is retained.`, "Cycle continued");
  }

  if (continued) {
    return (
      <div className="rounded-2xl border border-success/40 bg-success/5 p-5 mb-6 flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-success/15 flex-shrink-0">
          <CheckCircle2 className="size-5 text-success" />
        </div>
        <div>
          <p className="text-body font-semibold">{reference} continued into a new cycle</p>
          <p className="text-body-sm text-muted-foreground">Your slot is retained and your daily payments roll straight on — nothing else to do.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-accent/40 bg-accent/5 p-5 mb-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex size-10 items-center justify-center rounded-xl bg-accent/15 flex-shrink-0">
          <RefreshCw className="size-5 text-accent" />
        </div>
        <div>
          <p className="text-body font-semibold">{reference} completed a cycle — what next?</p>
          <p className="text-body-sm text-muted-foreground">
            You&apos;ve saved {naira(amountAllocated)}. Continue into another cycle (you keep your slot), or convert it to a product now. There&apos;s no cash-out.
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={continueCycle}
          disabled={busy}
          className={cn(buttonVariants({ variant: "outline" }), "flex-1 gap-2 justify-center disabled:opacity-60")}
        >
          <RefreshCw className={cn("size-4", busy && "animate-spin")} /> {busy ? "Continuing…" : "Continue another cycle"}
        </button>
        <Link href="/products" className={cn(buttonVariants(), "flex-1 gap-2 justify-center")}>
          <ShoppingCart className="size-4" /> Convert to a product
        </Link>
      </div>
    </div>
  );
}
