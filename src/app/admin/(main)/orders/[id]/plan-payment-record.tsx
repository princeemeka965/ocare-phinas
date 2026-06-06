"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Circle,
  Clock,
  ListChecks,
  Lock,
  Save,
  Truck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toastStore";
import { naira, SOLO_FREQUENCIES } from "@/lib/pay-small-small";
import {
  planPeriods,
  paidFromPeriods,
  paymentHealth,
  HEALTH_META,
  isArrears,
  type PlanPeriodStatus,
} from "@/lib/payment-health";
import {
  STATUS_META,
  planProcessingThreshold,
  type OrderStatus,
  type OrderPlan,
  type Order,
} from "@/lib/orders";

/** Fulfilment statuses an admin may set once the plan reaches its threshold. */
const FULFILMENT_STATUSES: OrderStatus[] = ["processing", "shipped", "delivered", "cancelled"];

const PERIOD_META: Record<PlanPeriodStatus, { label: string; badge: "success" | "warning" | "destructive" | "secondary" | "default"; icon: typeof Circle }> = {
  paid: { label: "Paid", badge: "success", icon: CheckCircle2 },
  due: { label: "Due now", badge: "default", icon: Clock },
  missed: { label: "Missed", badge: "destructive", icon: AlertTriangle },
  upcoming: { label: "Upcoming", badge: "secondary", icon: Circle },
};

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export function PlanPaymentRecord({
  order,
  children,
}: {
  order: Order & { plan: OrderPlan };
  children?: React.ReactNode;
}) {
  const { plan } = order;
  const isSolo = order.paymentPlan === "solo";
  const freqMeta = SOLO_FREQUENCIES[plan.frequency];

  const [paidIndices, setPaidIndices] = useState<number[]>(plan.paidIndices);
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [draft, setDraft] = useState<OrderStatus>(order.status);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const scheduleRef = useRef<HTMLDivElement>(null);

  const periods = planPeriods({
    price: plan.productPrice,
    perPayment: plan.perPayment,
    frequency: plan.frequency,
    startDate: plan.startDate,
    paidIndices,
  });

  const amountPaid = paidFromPeriods(periods);
  const balance = Math.max(0, plan.productPrice - amountPaid);
  const progress = Math.min(100, (amountPaid / plan.productPrice) * 100);

  const thresholdPct = planProcessingThreshold(order.paymentPlan);
  const thresholdAmount = Math.round(plan.productPrice * thresholdPct);
  const thresholdReached = amountPaid >= thresholdAmount;

  const health = paymentHealth({
    price: plan.productPrice,
    amountPaid,
    perPayment: plan.perPayment,
    frequency: plan.frequency,
    startDate: plan.startDate,
  });

  const paidCount = periods.filter((p) => p.status === "paid").length;
  const missedCount = periods.filter((p) => p.status === "missed").length;

  /* The fulfilment status badge shown at the top reflects either the plan
     stage (still collecting) or the manually-set fulfilment status. */
  const showStatus: OrderStatus = thresholdReached ? status : "in_plan";

  async function confirmPeriod(index: number) {
    setConfirming(index);
    // Phase 3: POST /api/admin/orders/:id/payments { period: index } — records
    // the manual confirmation and recomputes arrears. Does NOT touch stock.
    await new Promise((r) => setTimeout(r, 500));
    const next = [...paidIndices, index].sort((a, b) => a - b);
    setPaidIndices(next);
    setConfirming(null);

    const nextPaid = paidFromPeriods(
      planPeriods({ price: plan.productPrice, perPayment: plan.perPayment, frequency: plan.frequency, startDate: plan.startDate, paidIndices: next }),
    );
    if (nextPaid >= thresholdAmount && amountPaid < thresholdAmount) {
      toast.success(
        isSolo
          ? `50% reached — ${order.reference} can now move to Processing for delivery.`
          : `Fully paid — ${order.reference} can now move to Processing.`,
        "Threshold reached",
      );
    } else {
      toast.success(`Payment ${index} confirmed for ${order.reference}.`, "Payment confirmed");
    }
  }

  async function saveStatus() {
    setSaving(true);
    // Phase 3: PATCH /api/admin/orders/:id { status: draft }
    await new Promise((r) => setTimeout(r, 600));
    setStatus(draft);
    setSaving(false);
    toast.success(`${order.reference} marked “${STATUS_META[draft].label}”.`, "Status updated");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-body font-semibold">Payment record</h2>
        <div className="flex items-center gap-2">
          {isArrears(health.status) && (
            <Badge variant={HEALTH_META[health.status].badge} className="text-micro gap-1">
              {health.status === "overdue" ? <AlertTriangle className="size-3" /> : <Clock className="size-3" />}
              {HEALTH_META[health.status].label}
            </Badge>
          )}
          <Badge variant={STATUS_META[showStatus].variant} className="text-body-sm px-3 py-1">
            {STATUS_META[showStatus].label}
          </Badge>
        </div>
      </div>

      <button
        type="button"
        onClick={() => scheduleRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
        className="inline-flex items-center gap-1.5 self-start rounded-lg border border-border px-3 py-2 text-body-sm font-medium hover:bg-muted transition-colors"
      >
        <ListChecks className="size-4" /> View payment schedule
      </button>

      {/* Plan summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Per payment", value: `${naira(plan.perPayment)}${freqMeta.per}` },
          { label: "Paid", value: `${naira(amountPaid)}`, sub: `${paidCount}/${periods.length} ${freqMeta.unit}s` },
          { label: "Balance", value: naira(balance) },
          { label: isSolo ? "Delivers at 50%" : "Completes at 100%", value: naira(thresholdAmount) },
        ].map((cell) => (
          <div key={cell.label} className="rounded-xl border border-border bg-muted/40 p-3">
            <p className="text-micro text-muted-foreground uppercase tracking-wide">{cell.label}</p>
            <p className="text-body-sm font-bold">{cell.value}</p>
            {cell.sub && <p className="text-micro text-muted-foreground">{cell.sub}</p>}
          </div>
        ))}
      </div>

      {/* Progress to threshold */}
      <div>
        <div className="relative h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, background: "linear-gradient(90deg, oklch(0.55 0.15 150), oklch(0.72 0.17 78))" }}
          />
          <div
            aria-hidden
            className="absolute top-0 bottom-0 w-0.5 bg-foreground/40"
            style={{ left: `${thresholdPct * 100}%` }}
            title={`Processing at ${thresholdPct * 100}%`}
          />
        </div>
        <div className="flex justify-between text-micro text-muted-foreground mt-1">
          <span>{naira(amountPaid)} of {naira(plan.productPrice)}</span>
          <span>{progress.toFixed(0)}%</span>
        </div>
      </div>

      {/* Arrears note */}
      {isArrears(health.status) && (
        <div
          className={cn(
            "rounded-xl border p-3 text-caption flex items-start gap-2",
            health.status === "overdue" ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-warning/40 bg-warning/10 text-foreground",
          )}
        >
          <AlertTriangle className="size-4 flex-shrink-0 mt-0.5" />
          {health.status === "overdue" ? (
            <span><strong>{naira(health.arrears)} overdue</strong> — the schedule ended {fmt(health.completionDeadline)} ({health.daysOverdue} day{health.daysOverdue !== 1 ? "s" : ""} ago) with a balance owed. Shows in the Arrears section.</span>
          ) : (
            <span><strong>{naira(health.arrears)} behind</strong> — {missedCount} {freqMeta.unit}{missedCount !== 1 ? "s" : ""} missed. Shows in the Arrears section until caught up.</span>
          )}
        </div>
      )}

      {/* Fulfilment — unlocked only at the threshold */}
      {thresholdReached ? (
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 pt-2 border-t border-border">
          <div className="flex-1">
            <label htmlFor="fulfilment" className="text-body-sm font-medium block mb-1.5 flex items-center gap-1.5">
              <Truck className="size-4 text-primary" /> Fulfilment status
            </label>
            <Select id="fulfilment" value={draft} onChange={(e) => setDraft(e.target.value as OrderStatus)}>
              {FULFILMENT_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_META[s].label}</option>
              ))}
            </Select>
          </div>
          <Button onClick={saveStatus} disabled={draft === status || saving} className="gap-2 sm:w-auto w-full">
            <Save className="size-4" /> {saving ? "Saving…" : "Save status"}
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/40 px-4 py-3">
          <Lock className="size-4 text-muted-foreground flex-shrink-0" />
          <p className="text-body-sm text-muted-foreground">
            <CalendarClock className="inline size-3.5 mr-1 -mt-0.5" />
            Order moves to <strong>Processing</strong> once {isSolo ? "50% is paid" : "the full amount is paid"} ({naira(thresholdAmount)}). Confirming payments here does not change the order status until then.
          </p>
        </div>
      )}
      </div>

      {children}

      {/* Schedule — confirm each manual payment (full list, no scroll), pinned to the bottom */}
      <div ref={scheduleRef} id="payment-schedule" className="scroll-mt-20 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <p className="text-body-sm font-semibold mb-2">
          Payment schedule <span className="text-caption font-normal text-muted-foreground">· confirm a {freqMeta.unit} once the customer has paid (manual transfer)</span>
        </p>
        <div className="rounded-xl border border-border divide-y divide-border">
          {periods.map((period) => {
            const meta = PERIOD_META[period.status];
            const Icon = meta.icon;
            const canConfirm = period.status === "due" || period.status === "missed";
            return (
              <div key={period.index} className="flex items-center gap-3 px-4 py-2.5">
                <Icon
                  className={cn(
                    "size-4 flex-shrink-0",
                    period.status === "paid" && "text-success",
                    period.status === "missed" && "text-destructive",
                    period.status === "due" && "text-primary",
                    period.status === "upcoming" && "text-muted-foreground",
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-medium capitalize">
                    {freqMeta.unit} {period.index}
                    <span className="text-muted-foreground font-normal"> · due {fmt(period.dueDate)}</span>
                  </p>
                </div>
                <span className="text-body-sm font-semibold">{naira(period.amount)}</span>
                {canConfirm ? (
                  <button
                    onClick={() => confirmPeriod(period.index)}
                    disabled={confirming !== null}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-accent text-white text-caption font-semibold px-2.5 py-1.5 ring-1 ring-accent/40 hover:bg-accent/90 transition-colors disabled:opacity-60"
                  >
                    <CheckCircle2 className="size-3.5" /> {confirming === period.index ? "Confirming…" : "Confirm payment"}
                  </button>
                ) : (
                  <Badge variant={meta.badge} className="text-micro flex-shrink-0">{meta.label}</Badge>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-micro text-muted-foreground mt-2">
          Only due or missed {freqMeta.unit}s can be confirmed — no paying ahead. Missed {freqMeta.unit}s feed the Arrears section automatically; once the schedule ends with a balance owed it becomes overdue.
        </p>
      </div>
    </div>
  );
}
