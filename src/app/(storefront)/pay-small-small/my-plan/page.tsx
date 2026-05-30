import type { Metadata } from "next";
import Link from "next/link";
import { Wallet, MessageCircle, CheckCircle2, Clock, XCircle, ExternalLink } from "lucide-react";

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

/* Mock plan data — replace with authenticated fetch in Phase 3 */
const MOCK_PLAN = {
  type: "group" as const,
  reference: "G-013",
  dayCount: 12,
  dayTotal: 50,
  amountSaved: 12000,
  amountTarget: 50000,
  dailyAmount: 1000,
  status: "active" as const,
  targetItem: {
    name: "Sony WH-1000XM5 Wireless Headphones",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop&q=85",
    price: 22990,
  },
  contributions: [
    { id: "12", date: "2026-05-29", amount: 1000, status: "awaiting" as const },
    { id: "11", date: "2026-05-28", amount: 1000, status: "confirmed" as const },
    { id: "10", date: "2026-05-27", amount: 1000, status: "confirmed" as const },
    { id: "9", date: "2026-05-26", amount: 1000, status: "confirmed" as const },
    { id: "8", date: "2026-05-25", amount: 1000, status: "confirmed" as const },
    { id: "7", date: "2026-05-24", amount: 1000, status: "confirmed" as const },
    { id: "6", date: "2026-05-23", amount: 1000, status: "rejected" as const },
    { id: "5", date: "2026-05-22", amount: 1000, status: "confirmed" as const },
    { id: "4", date: "2026-05-21", amount: 1000, status: "confirmed" as const },
    { id: "3", date: "2026-05-20", amount: 1000, status: "confirmed" as const },
    { id: "2", date: "2026-05-19", amount: 1000, status: "confirmed" as const },
    { id: "1", date: "2026-05-18", amount: 1000, status: "confirmed" as const },
  ] as Contribution[],
};

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

  const waMessage = encodeURIComponent(
    `Hi OCare Phinas! I just paid ₦${plan.dailyAmount.toLocaleString("en-NG")} for plan ${plan.reference} (Day ${plan.dayCount + 1}). Please find my screenshot attached.`,
  );

  const isComplete = plan.amountSaved >= plan.amountTarget;

  return (
    <div className="py-8 sm:py-12">
      <Container className="max-w-2xl">
        <h1 className="text-h1 font-bold mb-8">My Plan</h1>

        {/* Plan header */}
        <div
          className="rounded-2xl p-6 mb-6 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, oklch(0.50 0.15 150), oklch(0.45 0.14 150))" }}
        >
          <div aria-hidden className="absolute -right-10 -top-10 size-40 rounded-full opacity-20 blur-2xl" style={{ background: "oklch(0.72 0.17 78)" }} />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-caption font-semibold text-white/70 uppercase tracking-wide">
                {plan.type === "group" ? `Group ${plan.reference}` : "Solo Plan"}
              </span>
              <Badge variant="default" className="text-micro bg-white/20 text-white border-white/30">Active</Badge>
            </div>

            <div className="flex items-end justify-between gap-4 mb-5">
              <div>
                <p className="text-display font-bold text-white">
                  ₦{plan.amountSaved.toLocaleString("en-NG")}
                </p>
                <p className="text-body-sm text-white/70">
                  of ₦{plan.amountTarget.toLocaleString("en-NG")} target
                </p>
              </div>
              <div className="text-right">
                <p className="text-h2 font-bold text-white">
                  Day {plan.dayCount}
                </p>
                <p className="text-body-sm text-white/70">of {plan.dayTotal}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-3 rounded-full bg-white/20 overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, oklch(0.75 0.15 150), oklch(0.82 0.17 78))",
                }}
              />
            </div>
            <p className="text-caption text-white/60">
              {progress.toFixed(0)}% complete · {plan.dayTotal - plan.dayCount} days remaining
            </p>
          </div>
        </div>

        {isComplete ? (
          /* Plan complete state */
          <div className="rounded-2xl border border-success/30 bg-success/5 p-6 mb-6 text-center">
            <CheckCircle2 className="size-12 text-success mx-auto mb-3" />
            <h2 className="text-h2 font-bold mb-2">Plan complete!</h2>
            <p className="text-body-sm text-muted-foreground mb-5">
              Congratulations! You&apos;ve reached your target. Our team will contact you to arrange fulfilment and delivery.
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
          /* Daily payment section */
          <div className="rounded-2xl border border-border bg-card p-6 mb-6">
            <h2 className="text-body font-semibold mb-4">Make today&apos;s payment</h2>

            <div className="space-y-3 mb-5">
              {[
                { label: "Bank", value: BANK.bank },
                { label: "Account name", value: BANK.name },
                { label: "Account number", value: BANK.number },
                { label: "Amount", value: `₦${plan.dailyAmount.toLocaleString("en-NG")}` },
                { label: "Narration / reference", value: plan.reference },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between gap-3 text-body-sm">
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

        {/* Target item */}
        <div className="rounded-2xl border border-border bg-card p-5 mb-6">
          <h2 className="text-body font-semibold mb-4">Saving toward</h2>
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-xl overflow-hidden border border-border flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={plan.targetItem.image} alt={plan.targetItem.name} className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="text-body-sm font-semibold">{plan.targetItem.name}</p>
              <p className="text-body font-bold text-primary">₦{plan.targetItem.price.toLocaleString("en-NG")}</p>
            </div>
          </div>
        </div>

        {/* Contribution ledger */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-body font-semibold">Payment history</h2>
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
      </Container>
    </div>
  );
}
