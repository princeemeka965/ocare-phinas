import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  MessageCircle,
  User,
  Users,
  ChevronRight,
  Truck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { naira, SOLO_FREQUENCIES } from "@/lib/pay-small-small";
import { HEALTH_META } from "@/lib/payment-health";
import { arrearsAcrossCustomers, type CustomerPlanHealth } from "@/lib/customers";
import { waLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Arrears — OCare Phinas Admin" };

const PLAN_ICON = { solo: User, group: Users } as const;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function ArrearsRow({ row }: { row: CustomerPlanHealth }) {
  const { customer, plan, health } = row;
  const Icon = PLAN_ICON[plan.type];
  const overdue = health.status === "overdue";

  const nudge = waLink(
    customer.phone,
    overdue
      ? `Hi ${customer.name}, your OCare Phinas plan ${plan.reference} has an overdue balance of ${naira(health.arrears)}. Please clear it to keep your account in good standing.`
      : `Hi ${customer.name}, a friendly reminder: you are ${naira(health.arrears)} behind on plan ${plan.reference}. Please catch up to stay on schedule.`,
  );

  return (
    <div
      className={
        "rounded-2xl border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 " +
        (overdue ? "border-destructive/30" : "border-warning/40")
      }
    >
      {/* Customer + plan */}
      <div className="flex items-center gap-3 sm:w-56 min-w-0">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold flex-shrink-0">
          {customer.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="text-body-sm font-semibold truncate">{customer.name}</p>
          <p className="text-micro text-muted-foreground font-mono flex items-center gap-1">
            <Icon className="size-3" /> {plan.reference}
            {plan.schedule?.delivered && (
              <span className="inline-flex items-center gap-0.5 text-success"><Truck className="size-3" /> delivered</span>
            )}
          </p>
        </div>
      </div>

      {/* Arrears figures */}
      <div className="sm:flex-1 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-caption">
        <div>
          <p className="text-micro text-muted-foreground uppercase tracking-wide">{overdue ? "Overdue" : "Behind"}</p>
          <p className={"font-bold " + (overdue ? "text-destructive" : "text-foreground")}>{naira(health.arrears)}</p>
        </div>
        <div>
          <p className="text-micro text-muted-foreground uppercase tracking-wide">Balance</p>
          <p className="font-semibold">{naira(health.balance)}</p>
        </div>
        <div>
          <p className="text-micro text-muted-foreground uppercase tracking-wide">Missed</p>
          <p className="font-semibold">
            {health.missedPeriods} {SOLO_FREQUENCIES[health.frequency].unit}{health.missedPeriods !== 1 ? "s" : ""}
          </p>
        </div>
        <div>
          <p className="text-micro text-muted-foreground uppercase tracking-wide">{overdue ? "Days overdue" : "Next due"}</p>
          <p className="font-semibold">
            {overdue ? `${health.daysOverdue} day${health.daysOverdue !== 1 ? "s" : ""}` : formatDate(health.nextDueDate)}
          </p>
        </div>
      </div>

      {/* Status + actions */}
      <div className="flex items-center gap-2 sm:flex-shrink-0 border-t border-border pt-3 sm:border-t-0 sm:pt-0">
        <Badge variant={HEALTH_META[health.status].badge} className="text-micro gap-1">
          {overdue ? <AlertTriangle className="size-3" /> : <Clock className="size-3" />}
          {HEALTH_META[health.status].label}
        </Badge>
        <a
          href={nudge}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg bg-[#25D366] hover:bg-[#1eb85a] text-white text-body-sm font-medium transition-colors"
        >
          <MessageCircle className="size-4" /> Nudge
        </a>
        <Link
          href={`/admin/customers/${customer.id}`}
          className="inline-flex items-center justify-center gap-1 h-9 px-2.5 rounded-lg border border-border text-body-sm font-medium hover:bg-muted transition-colors"
        >
          View <ChevronRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

export default function AdminArrearsPage() {
  const rows = arrearsAcrossCustomers();
  const overdue = rows.filter((r) => r.health.status === "overdue");
  const missed = rows.filter((r) => r.health.status === "missed");

  const overdueTotal = overdue.reduce((s, r) => s + r.health.arrears, 0);
  const missedTotal = missed.reduce((s, r) => s + r.health.arrears, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 font-bold">Arrears</h1>
        <p className="text-muted-foreground mt-1">
          Customers who have fallen behind on Pay Small Small payments. A plan is <strong>missed</strong> while it is behind
          schedule but still inside its agreed window, and <strong>overdue</strong> once the completion deadline has passed
          with a balance still owed — highest risk where the item is already delivered. Nudge customers on WhatsApp to
          catch up.
        </p>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-4 max-w-md">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-destructive/15 text-destructive mb-2">
            <AlertTriangle className="size-5" />
          </div>
          <p className="text-h2 font-bold text-destructive break-words">{naira(overdueTotal)}</p>
          <p className="text-body-sm font-medium text-muted-foreground mt-0.5">Overdue</p>
          <p className="text-caption text-muted-foreground">{overdue.length} plan{overdue.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="rounded-2xl border border-warning/40 bg-warning/10 p-5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-warning/30 text-foreground mb-2">
            <Clock className="size-5" />
          </div>
          <p className="text-h2 font-bold break-words">{naira(missedTotal)}</p>
          <p className="text-body-sm font-medium text-muted-foreground mt-0.5">Missed (behind)</p>
          <p className="text-caption text-muted-foreground">{missed.length} plan{missed.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-16 text-center">
          <CheckCircle className="size-12 text-success mx-auto mb-3 opacity-50" />
          <p className="text-h3 font-semibold">All clear</p>
          <p className="text-body-sm text-muted-foreground mt-1">No customers are behind on their payments.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {overdue.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-body font-semibold flex items-center gap-2 text-destructive">
                <AlertTriangle className="size-4" /> Overdue ({overdue.length})
              </h2>
              {overdue.map((r) => <ArrearsRow key={r.customer.id + r.plan.reference} row={r} />)}
            </section>
          )}

          {missed.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-body font-semibold flex items-center gap-2">
                <Clock className="size-4 text-warning" /> Missed payments ({missed.length})
              </h2>
              {missed.map((r) => <ArrearsRow key={r.customer.id + r.plan.reference} row={r} />)}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
