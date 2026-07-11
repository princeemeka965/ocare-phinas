"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MessageCircle,
  CheckCircle2,
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
import { api } from "@/lib/api";
import { useUserStore } from "@/store/userStore";
import { AuthRequired } from "@/components/storefront/auth-required";
import { naira, SOLO_DELIVERY_THRESHOLD, SOLO_FREQUENCIES, type SoloFrequency } from "@/lib/pay-small-small";
import { HEALTH_META, arrearsSummary, isArrears, type PaymentHealth } from "@/lib/payment-health";
import { SOLAR_STATUS_META } from "@/lib/solar";
import type { Plan, SolarApplication, SolarPackage } from "@/lib/db/types";
import { Sun } from "lucide-react";

type PlanType = "solo" | "group" | "outright";
type PlanStatus = "active" | "processing" | "delivered" | "completed" | "awaiting_substitution";

interface ApiPlan {
  id: string;
  type: PlanType;
  reference: string | null;
  productName: string | null;
  productImage: string | null;
  productPrice: number;
  deliveryFee: number;
  perPayment: number;
  frequency: SoloFrequency;
  slots: number;
  amountAllocated: number;
  status: PlanStatus;
  health: PaymentHealth | null;
  inArrears: boolean;
}

interface WalletData {
  total: number;
  available: number;
  spentOnProducts: number;
  soloAllocations: number;
  groupAllocations: number;
}

interface Contribution {
  id: string;
  date: string;
  amount: number;
  plan: string | null;
  periodIndex: number;
}

interface PublicSettings {
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  whatsappNumber: string;
}

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
  awaiting_substitution: { label: "Awaiting substitution", variant: "warning" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
}

interface SolarPlanData {
  application: SolarApplication;
  package: SolarPackage | null;
  plan: Plan | null;
  health: PaymentHealth | null;
}

function SolarPlanCard({ data }: { data: SolarPlanData | null }) {
  if (!data) return null;
  const { application: app, package: pkg, plan, health } = data;

  const meta = SOLAR_STATUS_META[app.status];
  const inRepayment = app.status === "active_repayment" || app.status === "completed";
  let progress = 0;
  let subtitle = meta.description;

  if (inRepayment && plan && health) {
    progress = Math.min(100, (plan.amountAllocated / plan.productPrice) * 100);
    subtitle = isArrears(health.status)
      ? `${HEALTH_META[health.status].label} — ${naira(health.arrears)}`
      : `${naira(plan.amountAllocated)} of ${naira(plan.productPrice)} paid`;
  }

  return (
    <Link
      href="/solar/application"
      className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 mb-8 hover:border-primary/40 transition-colors"
    >
      <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0">
        <Sun className="size-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <p className="text-body-sm font-semibold">{pkg?.name ?? "Solar Plan"}</p>
          <Badge variant={meta.badge} className="text-micro">{meta.label}</Badge>
        </div>
        <p className="text-caption text-muted-foreground line-clamp-1">{subtitle}</p>
        {inRepayment && (
          <div className="relative h-1.5 rounded-full bg-muted overflow-hidden mt-2 max-w-xs">
            <div className="h-full rounded-full" style={{ width: `${progress}%`, background: "linear-gradient(90deg, oklch(0.55 0.15 150), oklch(0.72 0.17 78))" }} />
          </div>
        )}
      </div>
      <ArrowRight className="size-5 text-muted-foreground flex-shrink-0" />
    </Link>
  );
}

export function MyPlanBoard() {
  const user = useUserStore((s) => s.user);
  const [plans, setPlans] = useState<ApiPlan[] | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [solar, setSolar] = useState<SolarPlanData | null>(null);

  useEffect(() => {
    if (!user) return;

    const load = () => {
      api.get<{ plans: ApiPlan[] }>("/api/me/plans").then((d) => setPlans(d.plans)).catch(() => setPlans([]));
      api.get<{ wallet: WalletData }>("/api/me/wallet").then((d) => setWallet(d.wallet)).catch(() => {});
      api.get<{ contributions: Contribution[] }>("/api/me/contributions").then((d) => setContributions(d.contributions)).catch(() => {});
      api.get<{ settings: PublicSettings }>("/api/settings").then((d) => setSettings(d.settings)).catch(() => {});
      api
        .get<{ application: SolarApplication | null; package: SolarPackage | null; plan: Plan | null; health: PaymentHealth | null }>("/api/solar/application")
        .then((d) => setSolar(d.application ? { application: d.application, package: d.package, plan: d.plan, health: d.health } : null))
        .catch(() => {});
    };
    load();

    // Safari/iOS can restore this page from bfcache on back/forward nav without
    // re-running this effect, leaving stale plans/wallet state on screen — force
    // a refetch when that happens.
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) load();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [user]);

  if (!user) {
    return (
      <AuthRequired
        title="Log in to see your plans"
        description="Sign in to track your Pay Small Small plans, wallet and payments."
      />
    );
  }

  if (plans === null || !wallet) {
    return (
      <div className="py-8 sm:py-12">
        <Container className="max-w-5xl">
          <div className="h-8 w-40 rounded bg-muted animate-pulse mb-6" />
          <div className="h-44 rounded-3xl bg-muted animate-pulse mb-6" />
          <div className="h-32 rounded-2xl border border-border bg-card animate-pulse" />
        </Container>
      </div>
    );
  }

  const healths = plans.map((p) => p.health).filter((h): h is PaymentHealth => h !== null);
  const summary = arrearsSummary(healths);
  const confirmedCount = contributions.length;
  const waNumber = settings?.whatsappNumber || "2340000000000";

  return (
    <div className="py-8 sm:py-12">
      <Container className="max-w-5xl">
        <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
          <h1 className="text-h1 font-bold">My Plans</h1>
          <span className="text-body-sm text-muted-foreground">
            {plans.length} active purchase{plans.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Arrears alert */}
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
                <p className="text-body font-bold text-white">{naira(wallet.groupAllocations)}</p>
              </div>
              <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-4">
                <p className="text-micro text-white/60 uppercase tracking-wide mb-1">Solo allocations</p>
                <p className="text-body font-bold text-white">{naira(wallet.soloAllocations)}</p>
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

        {/* Solar plan (separate flow — KYC-gated, its own status machine) */}
        <SolarPlanCard data={solar} />

        {/* Active plans */}
        <h2 className="text-body font-semibold mb-3">Your purchases</h2>
        {plans.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center mb-8">
            <p className="text-body-sm text-muted-foreground mb-4">You don&apos;t have any plans yet.</p>
            <Link href="/pay-small-small" className="text-primary font-medium hover:underline">Start a Pay Small Small plan →</Link>
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            {plans.map((plan) => {
              const TypeIcon = TYPE_META[plan.type].icon;
              const statusMeta = STATUS_META[plan.status];
              // The schedule collects the product price plus any door-delivery fee.
              const scheduleTotal = plan.productPrice + plan.deliveryFee;
              const progress = Math.min(100, (plan.amountAllocated / scheduleTotal) * 100);
              const deliveryTarget = plan.productPrice * SOLO_DELIVERY_THRESHOLD;
              const soloDelivered = plan.type === "solo" && plan.amountAllocated >= deliveryTarget;
              const balance = Math.max(0, scheduleTotal - plan.amountAllocated);
              const payable = plan.status === "active" || plan.status === "delivered" || plan.status === "processing";
              const health = plan.health;
              const inArrears = health ? isArrears(health.status) : false;

              const waMessage = encodeURIComponent(
                `Hi OCare Phinas! I just paid ${naira(plan.perPayment)} for plan ${plan.reference ?? ""}. Please find my screenshot attached.`,
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
                      {plan.productImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={plan.productImage} alt={plan.productName ?? ""} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <ShoppingCart className="size-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-caption font-semibold text-muted-foreground">
                          <TypeIcon className="size-3.5" /> {TYPE_META[plan.type].label}
                        </span>
                        {plan.reference && <span className="text-caption text-muted-foreground font-mono">· {plan.reference}</span>}
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
                          ? `${naira(plan.perPayment)}/day · ${plan.slots} slot${plan.slots !== 1 ? "s" : ""}`
                          : `${naira(plan.perPayment)}${SOLO_FREQUENCIES[plan.frequency ?? "daily"].per}`}
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
                          <span>{naira(plan.amountAllocated)} of {naira(scheduleTotal)}</span>
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
                        href={`https://wa.me/${waNumber}?text=${waMessage}`}
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
                        {inArrears ? `Pay ${naira(health!.arrears)} now` : `Pay ${naira(plan.perPayment)} today`}
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

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
                  { label: "Bank", value: settings?.bankName || "—" },
                  { label: "Account name", value: settings?.bankAccountName || "—" },
                  { label: "Account number", value: settings?.bankAccountNumber || "—" },
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
              {contributions.length === 0 ? (
                <p className="px-5 py-8 text-center text-body-sm text-muted-foreground">
                  No confirmed payments yet. Once staff confirm a payment it appears here.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {contributions.map((contrib) => (
                    <div key={contrib.id} className="flex items-center gap-3 px-5 py-3.5">
                      <CheckCircle2 className="size-4 text-success" />
                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm font-medium">
                          {new Date(contrib.date).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                        <p className="text-micro text-muted-foreground font-mono">{contrib.plan ?? "—"}</p>
                      </div>
                      <span className="text-body-sm font-semibold text-primary">{naira(contrib.amount)}</span>
                      <Badge variant="success" className="text-micro">Confirmed</Badge>
                    </div>
                  ))}
                </div>
              )}
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
