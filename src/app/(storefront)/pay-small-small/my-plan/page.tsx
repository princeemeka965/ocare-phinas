import type { Metadata } from "next";
import Link from "next/link";
import {
  MessageCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  Wallet,
  User,
  Users,
  ShoppingCart,
  ArrowRight,
  AlertTriangle,
  CalendarClock,
} from "lucide-react";

import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { naira, SOLO_DELIVERY_THRESHOLD, SOLO_FREQUENCIES } from "@/lib/pay-small-small";
import { HEALTH_META, arrearsSummary, isArrears, type PaymentHealth } from "@/lib/payment-health";
import {
  MOCK_PLANS,
  MOCK_WALLET,
  MOCK_CONTRIBUTIONS,
  planHealth,
  type PlanType,
  type PlanStatus,
  type ContribStatus,
} from "@/lib/my-plans";

export const metadata: Metadata = { title: "My Plan — Pay Small Small — OCare Phinas" };

const BANK = { name: "OCare Phinas Nigeria Ltd", number: "0123456789", bank: "GTBank" };
const WHATSAPP_NUMBER = "2340000000000";

const TYPE_META: Record<PlanType, { label: string; icon: typeof User }> = {
  solo: { label: "Solo Plan", icon: User },
  group: { label: "Group Plan", icon: Users },
  outright: { label: "Outright", icon: ShoppingCart },
};

const STATUS_META: Record<PlanStatus, { label: string; variant: "success" | "warning" | "secondary" | "default" }> = {
  active: { label: "Active", variant: "default" },
  processing: { label: "Processing", variant: "warning" },
  delivered: { label: "Delivered", variant: "success" },
  completed: { label: "Completed", variant: "secondary" },
};

const CONTRIB_ICON: Record<ContribStatus, React.ReactNode> = {
  confirmed: <CheckCircle2 className="size-4 text-success" />,
  awaiting: <Clock className="size-4 text-warning" />,
  rejected: <XCircle className="size-4 text-destructive" />,
};

const CONTRIB_BADGE: Record<ContribStatus, "success" | "warning" | "destructive"> = {
  confirmed: "success",
  awaiting: "warning",
  rejected: "destructive",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
}

export default function MyPlanPage() {
  const plans = MOCK_PLANS;
  const wallet = MOCK_WALLET;

  /* Allocations split by plan type, for the wallet breakdown. */
  const groupAllocated = plans.filter((p) => p.type === "group").reduce((s, p) => s + p.amountAllocated, 0);
  const soloAllocated = plans.filter((p) => p.type === "solo").reduce((s, p) => s + p.amountAllocated, 0);

  const confirmedCount = MOCK_CONTRIBUTIONS.filter((c) => c.status === "confirmed").length;

  /* Payment health per plan, and the overall arrears headline. */
  const healthById = new Map<string, PaymentHealth>();
  for (const plan of plans) {
    const h = planHealth(plan);
    if (h) healthById.set(plan.id, h);
  }
  const summary = arrearsSummary([...healthById.values()]);

  return (
    <div className="py-8 sm:py-12">
      <Container className="max-w-5xl">
        <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
          <h1 className="text-h1 font-bold">My Plans</h1>
          <span className="text-body-sm text-muted-foreground">
            {plans.length} active purchase{plans.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Arrears alert — shown the moment a payment is missed or overdue */}
        {summary.count > 0 && (
          <div
            className={
              "rounded-2xl border p-5 mb-6 " +
              (summary.status === "overdue"
                ? "border-destructive/30 bg-destructive/5"
                : "border-warning/40 bg-warning/10")
            }
          >
            <div className="flex items-start gap-3">
              <div
                className={
                  "flex size-9 flex-shrink-0 items-center justify-center rounded-xl " +
                  (summary.status === "overdue" ? "bg-destructive/15 text-destructive" : "bg-warning/30 text-foreground")
                }
              >
                <AlertTriangle className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-body font-semibold">
                  {summary.status === "overdue"
                    ? `You have ${naira(summary.overdueTotal)} overdue`
                    : `You are ${naira(summary.missedTotal)} behind on payments`}
                </p>
                <p className="text-body-sm text-muted-foreground mt-0.5">
                  {summary.overdueTotal > 0 && (
                    <>Overdue balance must be cleared to keep your account in good standing. </>
                  )}
                  {summary.missedTotal > 0 && (
                    <>Catch up on missed payments to stay on schedule and avoid going overdue. </>
                  )}
                  Pay the amount due on any plan below, then send your screenshot on WhatsApp.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Wallet summary */}
        <div
          className="rounded-3xl p-6 sm:p-8 mb-6 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, oklch(0.50 0.15 150), oklch(0.45 0.14 150))" }}
        >
          <div aria-hidden className="absolute -right-12 -top-12 size-56 rounded-full opacity-20 blur-3xl" style={{ background: "oklch(0.72 0.17 78)" }} />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="size-4 text-white/70" />
              <span className="text-caption font-semibold text-white/70 uppercase tracking-wide">Wallet balance</span>
            </div>
            <p className="text-display font-bold text-white leading-none mb-6">{naira(wallet.total)}</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-4">
                <p className="text-micro text-white/60 uppercase tracking-wide mb-1">Group allocations</p>
                <p className="text-body font-bold text-white">{naira(groupAllocated)}</p>
              </div>
              <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-4">
                <p className="text-micro text-white/60 uppercase tracking-wide mb-1">Solo allocations</p>
                <p className="text-body font-bold text-white">{naira(soloAllocated)}</p>
              </div>
              <div className="rounded-2xl bg-white/15 backdrop-blur-sm p-4 col-span-2 sm:col-span-1">
                <p className="text-micro text-white/60 uppercase tracking-wide mb-1">Available balance</p>
                <p className="text-body font-bold text-white">{naira(wallet.available)}</p>
              </div>
            </div>

            <p className="text-caption text-white/60 mt-4">
              Available balance can start a new plan or convert at a cycle&apos;s end — it can never be withdrawn as cash.
            </p>
          </div>
        </div>

        {/* Active plans */}
        <h2 className="text-body font-semibold mb-3">Your purchases</h2>
        <div className="space-y-4 mb-8">
          {plans.map((plan) => {
            const TypeIcon = TYPE_META[plan.type].icon;
            const statusMeta = STATUS_META[plan.status];
            const progress = Math.min(100, (plan.amountAllocated / plan.productPrice) * 100);
            const deliveryTarget = plan.productPrice * SOLO_DELIVERY_THRESHOLD;
            const soloDelivered = plan.type === "solo" && plan.amountAllocated >= deliveryTarget;
            const balance = Math.max(0, plan.productPrice - plan.amountAllocated);
            const payable = plan.status === "active" || plan.status === "delivered" || plan.status === "processing";
            const health = healthById.get(plan.id);
            const inArrears = health ? isArrears(health.status) : false;

            const waMessage = encodeURIComponent(
              `Hi OCare Phinas! I just paid ${naira(plan.daily)} for plan ${plan.reference}. Please find my screenshot attached.`,
            );

            return (
              <div
                key={plan.id}
                className={
                  "rounded-2xl border bg-card overflow-hidden " +
                  (inArrears
                    ? health!.status === "overdue"
                      ? "border-destructive/40"
                      : "border-warning/50"
                    : "border-border")
                }
              >
                <div className="flex gap-4 p-5">
                  <div className="size-20 rounded-xl overflow-hidden border border-border flex-shrink-0 bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={plan.productImage} alt={plan.productName} className="h-full w-full object-cover" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-caption font-semibold text-muted-foreground">
                        <TypeIcon className="size-3.5" /> {TYPE_META[plan.type].label}
                      </span>
                      <span className="text-caption text-muted-foreground font-mono">· {plan.reference}</span>
                      <Badge variant={statusMeta.variant} className="text-micro">{statusMeta.label}</Badge>
                      {inArrears && (
                        <Badge variant={HEALTH_META[health!.status].badge} className="text-micro gap-1">
                          <AlertTriangle className="size-3" />
                          {HEALTH_META[health!.status].label}
                        </Badge>
                      )}
                    </div>
                    <p className="text-body-sm font-semibold line-clamp-1">{plan.productName}</p>
                    <p className="text-caption text-muted-foreground">
                      {plan.type === "group"
                        ? `${naira(plan.daily)}/day · ${plan.slots} slot${plan.slots !== 1 ? "s" : ""}${plan.position ? ` · position ${plan.position}` : ""}`
                        : `${naira(plan.daily)}${SOLO_FREQUENCIES[plan.frequency ?? "daily"].per}`}
                    </p>

                    {/* Progress */}
                    <div className="mt-2.5">
                      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${progress}%`, background: "linear-gradient(90deg, oklch(0.55 0.15 150), oklch(0.72 0.17 78))" }}
                        />
                        {plan.type === "solo" && (
                          <div aria-hidden className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-foreground/30" title="Delivery at 50%" />
                        )}
                      </div>
                      <div className="flex justify-between text-micro text-muted-foreground mt-1">
                        <span>{naira(plan.amountAllocated)} of {naira(plan.productPrice)}</span>
                        <span>{progress.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arrears detail strip */}
                {inArrears && (
                  <div
                    className={
                      "border-t px-5 py-3 text-caption flex items-center gap-2 flex-wrap " +
                      (health!.status === "overdue"
                        ? "border-destructive/30 bg-destructive/5 text-destructive"
                        : "border-warning/40 bg-warning/10 text-foreground")
                    }
                  >
                    <AlertTriangle className="size-3.5 flex-shrink-0" />
                    {health!.status === "overdue" ? (
                      <span>
                        <strong>{naira(health!.arrears)} overdue</strong> — payment was due by {formatDate(health!.completionDeadline)} ({health!.daysOverdue} day{health!.daysOverdue !== 1 ? "s" : ""} ago).
                      </span>
                    ) : (
                      <span>
                        <strong>{naira(health!.arrears)} behind</strong> — {health!.missedPeriods} {SOLO_FREQUENCIES[health!.frequency].unit}
                        {health!.missedPeriods !== 1 ? "s" : ""} missed. Next payment due {formatDate(health!.nextDueDate)}.
                      </span>
                    )}
                  </div>
                )}

                {/* Status line + pay action */}
                <div className="border-t border-border px-5 py-3 flex items-center justify-between gap-3 flex-wrap bg-muted/30">
                  <p className="text-caption text-muted-foreground flex items-center gap-1.5">
                    {plan.type === "solo" ? (
                      soloDelivered ? (
                        <>
                          <Truck className="size-3.5 text-success" />
                          Delivered — finishing balance of {naira(balance)}
                        </>
                      ) : (
                        <>
                          <Truck className="size-3.5 text-primary" />
                          Delivers at 50% ({naira(deliveryTarget)})
                        </>
                      )
                    ) : plan.status === "completed" ? (
                      <>
                        <CheckCircle2 className="size-3.5 text-success" />
                        Completed — paid off and delivered. Your slot is free for a new plan.
                      </>
                    ) : (
                      <>
                        <Users className="size-3.5 text-primary" />
                        Delivered by group position as funds build
                      </>
                    )}
                  </p>

                  {payable && (
                    <a
                      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={
                        "inline-flex items-center gap-2 rounded-lg text-white font-semibold text-caption px-3 py-2 transition-colors " +
                        (inArrears && health!.status === "overdue"
                          ? "bg-destructive hover:bg-destructive/90"
                          : "bg-[#25D366] hover:bg-[#1eb85a]")
                      }
                    >
                      {inArrears ? <CalendarClock className="size-4" /> : <MessageCircle className="size-4" />}
                      {inArrears ? `Pay ${naira(health!.arrears)} now` : `Pay ${naira(plan.daily)} today`}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Two-column: bank details + ledger */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bank details */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-body font-semibold mb-1">How to pay</h2>
              <p className="text-caption text-muted-foreground mb-4">
                Transfer the exact daily amount for a plan, then send your screenshot on WhatsApp. Use the plan
                reference as your narration.
              </p>
              <div className="rounded-xl border border-border bg-muted/40 divide-y divide-border">
                {[
                  { label: "Bank", value: BANK.bank },
                  { label: "Account name", value: BANK.name },
                  { label: "Account number", value: BANK.number },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between gap-3 px-4 py-3 text-body-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold font-mono text-right">{value}</span>
                  </div>
                ))}
              </div>
              <p className="text-micro text-muted-foreground mt-3">
                Payments are strictly the daily amount — no paying ahead. Staff confirm manually and update your ledger.
              </p>
            </div>
          </div>

          {/* Contribution ledger */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="text-body font-semibold">Contribution ledger</h2>
                <span className="text-caption text-muted-foreground">{confirmedCount} confirmed</span>
              </div>
              <div className="divide-y divide-border">
                {MOCK_CONTRIBUTIONS.map((contrib) => (
                  <div key={contrib.id} className="flex items-center gap-3 px-5 py-3.5">
                    {CONTRIB_ICON[contrib.status]}
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium">
                        {new Date(contrib.date).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                      <p className="text-micro text-muted-foreground font-mono">{contrib.plan}</p>
                    </div>
                    <span className="text-body-sm font-semibold text-primary">{naira(contrib.amount)}</span>
                    <Badge variant={CONTRIB_BADGE[contrib.status]} className="text-micro">
                      {contrib.status === "confirmed" ? "Confirmed" : contrib.status === "awaiting" ? "Awaiting" : "Rejected"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Start another plan */}
            <Link
              href="/pay-small-small"
              className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-dashed border-border bg-card p-5 hover:border-primary/40 transition-colors"
            >
              <div>
                <p className="text-body-sm font-semibold">Start another plan</p>
                <p className="text-caption text-muted-foreground">One account runs as many plans as you like.</p>
              </div>
              <ArrowRight className="size-5 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
