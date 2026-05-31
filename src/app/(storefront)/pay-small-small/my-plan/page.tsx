import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, CheckCircle2, Clock, XCircle, ExternalLink, Truck } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "My Plan — Pay Small Small — OCare Phinas" };

type ContribStatus = "confirmed" | "awaiting" | "rejected";

interface Contribution {
  id: string;
  date: string;
  amount: number;
  status: ContribStatus;
}

/* Mock plan data — replace with authenticated fetch in Phase 3.
   A flexible solo plan: ₦10,000 weekly toward a ₦350,000 freezer.
   Item ships once 50% (₦175,000) is paid. */
const MOCK_PLAN = {
  type: "solo" as "group" | "solo",
  reference: "SOLO-0042",
  frequency: "weekly" as "daily" | "weekly" | "monthly",
  paymentsMade: 9,
  amountSaved: 90000,
  amountTarget: 350000,
  cycleAmount: 10000,
  status: "active" as const,
  targetItem: {
    name: "Haier Thermocool Chest Freezer 300L",
    image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&h=400&fit=crop&q=85",
    price: 350000,
  },
  contributions: [
    { id: "9", date: "2026-05-25", amount: 10000, status: "awaiting" as const },
    { id: "8", date: "2026-05-18", amount: 10000, status: "confirmed" as const },
    { id: "7", date: "2026-05-11", amount: 10000, status: "confirmed" as const },
    { id: "6", date: "2026-05-04", amount: 10000, status: "confirmed" as const },
    { id: "5", date: "2026-04-27", amount: 10000, status: "confirmed" as const },
    { id: "4", date: "2026-04-20", amount: 10000, status: "rejected" as const },
    { id: "3", date: "2026-04-13", amount: 10000, status: "confirmed" as const },
    { id: "2", date: "2026-04-06", amount: 10000, status: "confirmed" as const },
    { id: "1", date: "2026-03-30", amount: 10000, status: "confirmed" as const },
  ] as Contribution[],
};

const FREQUENCY_LABEL: Record<"daily" | "weekly" | "monthly", string> = {
  daily: "daily",
  weekly: "weekly",
  monthly: "monthly",
};

const DELIVERY_THRESHOLD = 0.5; // item ships once 50% is paid

const BANK = { name: "OCare Phinas Nigeria Ltd", number: "0123456789", bank: "GTBank" };
const WHATSAPP_NUMBER = "2340000000000";

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

export default function MyPlanPage() {
  const plan = MOCK_PLAN;
  const progress = (plan.amountSaved / plan.amountTarget) * 100;
  const freqLabel = FREQUENCY_LABEL[plan.frequency];

  /* Delivery milestone — item ships once the customer hits 50% paid */
  const deliveryTarget = plan.amountTarget * DELIVERY_THRESHOLD;
  const isDelivered = plan.amountSaved >= deliveryTarget;
  const amountToDelivery = Math.max(0, deliveryTarget - plan.amountSaved);
  const paymentsToDelivery = Math.ceil(amountToDelivery / plan.cycleAmount);
  const balanceRemaining = Math.max(0, plan.amountTarget - plan.amountSaved);

  const waMessage = encodeURIComponent(
    `Hi OCare Phinas! I just paid ₦${plan.cycleAmount.toLocaleString("en-NG")} for plan ${plan.reference} (payment ${plan.paymentsMade + 1}). Please find my screenshot attached.`,
  );

  const isComplete = plan.amountSaved >= plan.amountTarget;

  const confirmedCount = plan.contributions.filter((c) => c.status === "confirmed").length;

  return (
    <div className="py-8 sm:py-12">
      <Container className="max-w-5xl">
        <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
          <h1 className="text-h1 font-bold">My Plan</h1>
          <span className="text-body-sm text-muted-foreground font-mono">{plan.reference}</span>
        </div>

        {/* Plan header */}
        <div
          className="rounded-3xl p-6 sm:p-8 mb-6 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, oklch(0.50 0.15 150), oklch(0.45 0.14 150))" }}
        >
          <div aria-hidden className="absolute -right-12 -top-12 size-56 rounded-full opacity-20 blur-3xl" style={{ background: "oklch(0.72 0.17 78)" }} />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-caption font-semibold text-white/70 uppercase tracking-wide">
                {plan.type === "group" ? `Group ${plan.reference}` : "Solo Plan"}
              </span>
              <Badge variant="default" className="text-micro bg-white/20 text-white border-white/30">Active</Badge>
              <span className="text-caption text-white/60">· ₦{plan.cycleAmount.toLocaleString("en-NG")} {freqLabel}</span>
            </div>

            {/* Stat row */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-h1 font-bold text-white leading-none">₦{plan.amountSaved.toLocaleString("en-NG")}</p>
                <p className="text-caption text-white/70 mt-1.5">paid so far</p>
              </div>
              <div>
                <p className="text-h1 font-bold text-white leading-none">₦{plan.amountTarget.toLocaleString("en-NG")}</p>
                <p className="text-caption text-white/70 mt-1.5">item price</p>
              </div>
              <div>
                <p className="text-h1 font-bold text-white leading-none">{plan.paymentsMade}</p>
                <p className="text-caption text-white/70 mt-1.5">payments made</p>
              </div>
            </div>

            {/* Progress bar with 50% delivery marker */}
            <div className="relative h-3 rounded-full bg-white/20 overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, oklch(0.75 0.15 150), oklch(0.82 0.17 78))",
                }}
              />
              <div aria-hidden className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/70" title="Delivery at 50%" />
            </div>
            <p className="text-caption text-white/60">
              {progress.toFixed(0)}% paid · {isDelivered ? "delivered — finishing balance" : `delivers at 50% (₦${deliveryTarget.toLocaleString("en-NG")})`}
            </p>
          </div>
        </div>

        {/* Delivery milestone banner */}
        {!isComplete && (
          isDelivered ? (
            <div className="flex items-start gap-3 rounded-2xl border border-success/30 bg-success/5 p-4 mb-6">
              <Truck className="size-5 text-success flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-body-sm font-semibold">Halfway reached — your item is on its way!</p>
                <p className="text-caption text-muted-foreground">
                  You&apos;ve passed the 50% mark, so we&apos;re arranging delivery. Keep paying {freqLabel} to clear your remaining balance of ₦{balanceRemaining.toLocaleString("en-NG")}.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 mb-6">
              <Truck className="size-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-body-sm font-semibold">₦{amountToDelivery.toLocaleString("en-NG")} away from delivery</p>
                <p className="text-caption text-muted-foreground">
                  Once you reach ₦{deliveryTarget.toLocaleString("en-NG")} (50%) we deliver your item — about {paymentsToDelivery} more {freqLabel} payment{paymentsToDelivery !== 1 ? "s" : ""}. You then finish the balance at your own pace.
                </p>
              </div>
            </div>
          )
        )}

        {/* Two-column body */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {isComplete ? (
              /* Plan complete state */
              <div className="rounded-2xl border border-success/30 bg-success/5 p-6 text-center">
                <CheckCircle2 className="size-12 text-success mx-auto mb-3" />
                <h2 className="text-h2 font-bold mb-2">Plan complete!</h2>
                <p className="text-body-sm text-muted-foreground mb-5">
                  Congratulations! You&apos;ve fully paid off your item. If it hasn&apos;t arrived yet, our team will contact you to finalise delivery.
                </p>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi! My plan ${plan.reference} is complete. Ready to claim my item.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-body-sm font-semibold text-white hover:bg-[#1eb85a] transition-colors"
                >
                  <MessageCircle className="size-4" /> Claim my item on WhatsApp
                </a>
              </div>
            ) : (
              /* Payment section */
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-body font-semibold mb-1">Make your {freqLabel} payment</h2>
                <p className="text-caption text-muted-foreground mb-5">
                  Transfer to the account below, then send your screenshot on WhatsApp for confirmation.
                </p>

                <div className="rounded-xl border border-border bg-muted/40 divide-y divide-border mb-5">
                  {[
                    { label: "Bank", value: BANK.bank },
                    { label: "Account name", value: BANK.name },
                    { label: "Account number", value: BANK.number },
                    { label: "Amount", value: `₦${plan.cycleAmount.toLocaleString("en-NG")}` },
                    { label: "Narration / reference", value: plan.reference },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between gap-3 px-4 py-3 text-body-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-semibold font-mono">{value}</span>
                    </div>
                  ))}
                </div>

                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 w-full rounded-xl bg-[#25D366] hover:bg-[#1eb85a] text-white font-semibold text-body py-3.5 transition-colors"
                >
                  <MessageCircle className="size-5" />
                  I&apos;ve paid — send screenshot on WhatsApp
                  <ExternalLink className="size-4 opacity-70" />
                </a>
              </div>
            )}

            {/* Contribution ledger */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="text-body font-semibold">Payment history</h2>
                <span className="text-caption text-muted-foreground">{confirmedCount} confirmed</span>
              </div>
              <div className="divide-y divide-border">
                {plan.contributions.map((contrib) => (
                  <div key={contrib.id} className="flex items-center gap-3 px-5 py-3.5">
                    {CONTRIB_ICON[contrib.status]}
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium">
                        {new Date(contrib.date).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <span className="text-body-sm font-semibold text-primary">
                      ₦{contrib.amount.toLocaleString("en-NG")}
                    </span>
                    <Badge variant={CONTRIB_BADGE[contrib.status]} className="text-micro">
                      {contrib.status === "confirmed" ? "Confirmed" : contrib.status === "awaiting" ? "Awaiting" : "Rejected"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Aside: target item */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 rounded-2xl border border-border bg-card overflow-hidden">
              <div className="aspect-square w-full overflow-hidden border-b border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={plan.targetItem.image} alt={plan.targetItem.name} className="h-full w-full object-cover" />
              </div>
              <div className="p-5">
                <p className="text-caption font-semibold uppercase tracking-wide text-muted-foreground mb-1">Saving toward</p>
                <p className="text-body-sm font-semibold mb-1">{plan.targetItem.name}</p>
                <p className="text-h3 font-bold text-primary">₦{plan.targetItem.price.toLocaleString("en-NG")}</p>
                <div className="mt-4 pt-4 border-t border-border flex justify-between text-body-sm">
                  <span className="text-muted-foreground">Remaining</span>
                  <span className="font-semibold">₦{balanceRemaining.toLocaleString("en-NG")}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </Container>
    </div>
  );
}
