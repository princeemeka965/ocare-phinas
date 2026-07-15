"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Clock, Lock, Save, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import { toast } from "@/store/toastStore";
import { STATUS_FLOW, STATUS_META, type OrderStatus } from "@/lib/orders";

/** Statuses an admin may set manually once the payment is confirmed. */
const POST_CONFIRM_STATUSES: OrderStatus[] = ["processing", "shipped", "delivered", "cancelled"];
const FLOW_KEYS = STATUS_FLOW.map((s) => s.key);

export function StatusManager({
  orderId,
  reference,
  initialStatus,
}: {
  orderId: string;
  reference: string;
  initialStatus: OrderStatus;
}) {
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const [draft, setDraft] = useState<OrderStatus>(initialStatus);
  const [saving, setSaving] = useState(false);
  const [deciding, setDeciding] = useState<null | "confirm" | "reject">(null);

  const dirty = draft !== status;
  const isCancelled = status === "cancelled";
  // Confirm/reject an outright payment from either "pending_payment" (the
  // customer paid and messaged you directly, without tapping "I've made the
  // bank transfer" in the app) or "payment_submitted" (they did) — the
  // backend (/api/admin/orders/:id/confirm and /reject) already accepts
  // both; this just keeps the button visible for both.
  const awaitingPayment = status === "payment_submitted" || status === "pending_payment";
  /** Status can only be advanced once the payment has been confirmed. */
  const paymentConfirmed = (["confirmed", "processing", "shipped", "delivered"] as OrderStatus[]).includes(status);
  const statusIdx = FLOW_KEYS.indexOf(status);

  async function save() {
    setSaving(true);
    try {
      const { order } = await api.patch<{ order: { status: OrderStatus } }>(
        `/api/admin/orders/${orderId}/status`,
        { status: draft },
      );
      setStatus(order.status);
      toast.success(`${reference} marked “${STATUS_META[order.status].label}”.`, "Status updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't update the status.");
    } finally {
      setSaving(false);
    }
  }

  /** Confirm or reject the customer's payment — drives the same order status.
      Confirming decrements stock atomically server-side. */
  async function decide(kind: "confirm" | "reject") {
    setDeciding(kind);
    try {
      const { order } = await api.post<{ order: { status: OrderStatus } }>(
        `/api/admin/orders/${orderId}/${kind}`,
      );
      setStatus(order.status);
      setDraft(order.status);
      if (kind === "confirm")
        toast.success(`${reference} payment confirmed — stock decremented, order now processing.`, "Payment confirmed");
      else toast.info(`${reference} payment rejected — order cancelled.`, "Payment rejected");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't record that decision.");
    } finally {
      setDeciding(null);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-body font-semibold">Order status</h2>
        <Badge variant={STATUS_META[status].variant} className="text-body-sm px-3 py-1">
          {STATUS_META[status].label}
        </Badge>
      </div>

      {/* Progress timeline */}
      {isCancelled ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
          <XCircle className="size-5 text-destructive flex-shrink-0" />
          <p className="text-body-sm font-medium text-destructive">This order was cancelled. Stock was not decremented.</p>
        </div>
      ) : (
        <>
          {/* Vertical timeline — mobile */}
          <ol className="sm:hidden">
            {STATUS_FLOW.map((step, i) => {
              const done = FLOW_KEYS.indexOf(step.key) <= statusIdx;
              const current = step.key === status;
              const last = i === STATUS_FLOW.length - 1;
              const nextDone = !last && FLOW_KEYS.indexOf(STATUS_FLOW[i + 1].key) <= statusIdx;
              return (
                <li key={step.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "flex size-8 items-center justify-center rounded-full border-2 transition-colors",
                      done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground",
                    )}>
                      {done ? (current ? <Clock className="size-4" /> : <CheckCircle2 className="size-4" />) : <Circle className="size-4" />}
                    </div>
                    {!last && <div className={cn("w-0.5 flex-1 min-h-[1.25rem] my-1 transition-colors", nextDone ? "bg-primary" : "bg-border")} />}
                  </div>
                  <span className={cn("text-body-sm font-medium leading-tight pt-1.5", last ? "pb-0" : "pb-4", done ? "text-primary" : "text-muted-foreground")}>
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>

          {/* Horizontal timeline — sm and up */}
          <div className="hidden sm:flex items-start gap-0">
            {STATUS_FLOW.map((step, i) => {
              const done = FLOW_KEYS.indexOf(step.key) <= statusIdx;
              const current = step.key === status;
              return (
                <div key={step.key} className={cn("flex items-start", i < STATUS_FLOW.length - 1 ? "flex-1 min-w-[64px]" : "flex-shrink-0")}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={cn(
                      "flex size-8 items-center justify-center rounded-full border-2 transition-colors",
                      done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground",
                    )}>
                      {done ? (current ? <Clock className="size-4" /> : <CheckCircle2 className="size-4" />) : <Circle className="size-4" />}
                    </div>
                    <span className={cn("text-micro font-medium max-w-[70px] text-center leading-tight", done ? "text-primary" : "text-muted-foreground")}>
                      {step.label}
                    </span>
                  </div>
                  {i < STATUS_FLOW.length - 1 && (
                    <div className={cn(
                      "h-0.5 flex-1 min-w-[1.5rem] mx-1 mt-4 transition-colors",
                      FLOW_KEYS.indexOf(STATUS_FLOW[i + 1].key) <= statusIdx ? "bg-primary" : "bg-border",
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Payment confirmation — shown while awaiting confirmation */}
      {awaitingPayment && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 space-y-3">
          <div>
            <p className="text-body-sm font-semibold">Payment awaiting confirmation</p>
            <p className="text-caption text-muted-foreground">
              The customer sent their transfer screenshot on WhatsApp. Confirm once you&apos;ve seen the funds on your statement — confirming decrements stock atomically.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => decide("confirm")}
              disabled={deciding !== null}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-success text-white font-semibold text-body-sm hover:bg-success/90 transition-colors disabled:opacity-60"
            >
              <CheckCircle2 className="size-4" /> {deciding === "confirm" ? "Confirming…" : "Confirm payment"}
            </button>
            <button
              onClick={() => decide("reject")}
              disabled={deciding !== null}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-destructive/30 text-destructive font-semibold text-body-sm hover:bg-destructive/10 transition-colors disabled:opacity-60"
            >
              <XCircle className="size-4" /> {deciding === "reject" ? "Rejecting…" : "Reject payment"}
            </button>
          </div>
        </div>
      )}

      {/* Change control — only available after the payment is confirmed */}
      {paymentConfirmed ? (
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 pt-2 border-t border-border">
          <div className="flex-1">
            <label htmlFor="status" className="text-body-sm font-medium block mb-1.5">Update status</label>
            <Select id="status" value={draft} onChange={(e) => setDraft(e.target.value as OrderStatus)}>
              {POST_CONFIRM_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_META[s].label}</option>
              ))}
            </Select>
          </div>
          <Button onClick={save} disabled={!dirty || saving} className="gap-2 sm:w-auto w-full">
            <Save className="size-4" /> {saving ? "Saving…" : "Save status"}
          </Button>
        </div>
      ) : !isCancelled ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/40 px-4 py-3">
          <Lock className="size-4 text-muted-foreground flex-shrink-0" />
          <p className="text-body-sm text-muted-foreground">Confirm the payment above before updating the order status.</p>
        </div>
      ) : null}
    </div>
  );
}
