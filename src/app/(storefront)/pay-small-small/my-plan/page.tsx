import type { Metadata } from "next";
import Link from "next/link";
import {
  MessageCircle,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Truck,
  Wallet,
  User,
  Users,
  ShoppingCart,
  RefreshCw,
  ArrowRight,
} from "lucide-react";

import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { naira, SOLO_DELIVERY_THRESHOLD, SOLO_FREQUENCIES, type SoloFrequency } from "@/lib/pay-small-small";
import { CycleCompletePrompt } from "./cycle-complete-prompt";

export const metadata: Metadata = { title: "My Plan — Pay Small Small — OCare Phinas" };

const BANK = { name: "OCare Phinas Nigeria Ltd", number: "0123456789", bank: "GTBank" };
const WHATSAPP_NUMBER = "2340000000000";

type PlanType = "solo" | "group" | "outright";
type PlanStatus = "active" | "processing" | "delivered" | "completed_cycle";

interface Plan {
  id: string;
  type: PlanType;
  reference: string;
  productName: string;
  productImage: string;
  productPrice: number;
  slots?: number; // group only — the shared slot pool
  frequency?: SoloFrequency; // solo only — how often the customer pays
  daily: number; // amount paid each period
  amountAllocated: number;
  status: PlanStatus;
  position?: number; // group position
}

type ContribStatus = "confirmed" | "awaiting" | "rejected";
interface Contribution {
  id: string;
  date: string;
  amount: number;
  plan: string;
  status: ContribStatus;
}

/* ------------------------------------------------------------------ */
/* Mock wallet + plans — replace with authenticated fetch in Phase 3.  */
/* One account, one wallet, many concurrent plans (payment-flow §1,§4) */
/* Money never withdraws as cash — it only ever becomes a product.     */
/* ------------------------------------------------------------------ */
const MOCK_PLANS: Plan[] = [
  {
    id: "p1",
    type: "solo",
    reference: "SOLO-0042",
    productName: "Haier Thermocool Chest Freezer 300L",
    productImage: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&h=400&fit=crop&q=85",
    productPrice: 350000,
    frequency: "daily",
    daily: 7000,
    amountAllocated: 196000, // past 50% → delivered, finishing balance
    status: "delivered",
  },
  {
    id: "p2",
    type: "group",
    reference: "G-016",
    productName: 'LG OLED evo C3 55" 4K Smart TV',
    productImage: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400&h=400&fit=crop&q=85",
    productPrice: 89990,
    slots: 2,
    daily: 2000,
    amountAllocated: 84000, // ~42/50 payments
    status: "active",
    position: 8,
  },
  {
    id: "p3",
    type: "group",
    reference: "G-014",
    productName: "Sony PlayStation 5 Slim",
    productImage: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=400&fit=crop&q=85",
    productPrice: 56000,
    slots: 2,
    daily: 2000,
    amountAllocated: 100000, // completed a full cycle (2 slots × ₦50k)
    status: "completed_cycle",
    position: 3,
  },
];

/* Wallet: total = everything paid in not yet consumed by a delivered product;
   allocations = committed to active plans; available = uncommitted. */
const MOCK_WALLET = {
  total: 105000,
  available: 5000,
};

const MOCK_CONTRIBUTIONS: Contribution[] = [
  { id: "c1", date: "2026-06-01", amount: 7000, plan: "SOLO-0042", status: "awaiting" },
  { id: "c2", date: "2026-06-01", amount: 2000, plan: "G-016", status: "awaiting" },
  { id: "c3", date: "2026-05-31", amount: 7000, plan: "SOLO-0042", status: "confirmed" },
  { id: "c4", date: "2026-05-31", amount: 2000, plan: "G-016", status: "confirmed" },
  { id: "c5", date: "2026-05-30", amount: 7000, plan: "SOLO-0042", status: "confirmed" },
  { id: "c6", date: "2026-05-29", amount: 2000, plan: "G-016", status: "rejected" },
  { id: "c7", date: "2026-05-28", amount: 7000, plan: "SOLO-0042", status: "confirmed" },
];

const TYPE_META: Record<PlanType, { label: string; icon: typeof User }> = {
  solo: { label: "Solo Plan", icon: User },
  group: { label: "Group Plan", icon: Users },
  outright: { label: "Outright", icon: ShoppingCart },
};

const STATUS_META: Record<PlanStatus, { label: string; variant: "success" | "warning" | "secondary" | "default" }> = {
  active: { label: "Active", variant: "default" },
  processing: { label: "Processing", variant: "warning" },
  delivered: { label: "Delivered", variant: "success" },
  completed_cycle: { label: "Completed cycle", variant: "secondary" },
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

export default function MyPlanPage() {
  const plans = MOCK_PLANS;
  const wallet = MOCK_WALLET;

  /* Allocations split by plan type, for the wallet breakdown. */
  const groupAllocated = plans.filter((p) => p.type === "group").reduce((s, p) => s + p.amountAllocated, 0);
  const soloAllocated = plans.filter((p) => p.type === "solo").reduce((s, p) => s + p.amountAllocated, 0);

  const cycleComplete = plans.find((p) => p.status === "completed_cycle");
  const confirmedCount = MOCK_CONTRIBUTIONS.filter((c) => c.status === "confirmed").length;

  return (
    <div className="py-8 sm:py-12">
      <Container className="max-w-5xl">
        <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
          <h1 className="text-h1 font-bold">My Plans</h1>
          <span className="text-body-sm text-muted-foreground">
            {plans.length} active purchase{plans.length !== 1 ? "s" : ""}
          </span>
        </div>

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

        {/* Completed-cycle prompt (payment-flow §6) */}
        {cycleComplete && (
          <CycleCompletePrompt reference={cycleComplete.reference} amountAllocated={cycleComplete.amountAllocated} />
        )}

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

            const waMessage = encodeURIComponent(
              `Hi OCare Phinas! I just paid ${naira(plan.daily)} for plan ${plan.reference}. Please find my screenshot attached.`,
            );

            return (
              <div key={plan.id} className="rounded-2xl border border-border bg-card overflow-hidden">
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
                    ) : plan.status === "completed_cycle" ? (
                      <>
                        <RefreshCw className="size-3.5 text-accent" />
                        Cycle complete — choose continue or convert above
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
                      className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#1eb85a] text-white font-semibold text-caption px-3 py-2 transition-colors"
                    >
                      <MessageCircle className="size-4" /> Pay {naira(plan.daily)} today
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
