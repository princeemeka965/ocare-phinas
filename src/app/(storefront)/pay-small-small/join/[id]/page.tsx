"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  Users,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Lock,
  CalendarDays,
  Banknote,
  MessageCircle,
  Target,
  AlertTriangle,
} from "lucide-react";

import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/userStore";
import { AuthRequired } from "@/components/storefront/auth-required";
import {
  SLOT_DAILY,
  CYCLE_DAYS,
  SLOT_CYCLE_VALUE,
  GROUP_PRICE_CAP,
  GROUP_MAX_SLOTS_PER_CUSTOMER,
  isGroupEligible,
  groupSlotsForPrice,
  dailyForSlots,
  naira,
} from "@/lib/pay-small-small";

interface Group {
  id: string;
  reference: string;
  slotsFilled: number;
  totalSlots: number;
  startDate: string;
  status: "open" | "full" | "completed";
}

/* Mock groups — mirrors the list in ../page.tsx. Replace with DB fetch in Phase 3. */
const MOCK_GROUPS: Group[] = [
  { id: "1", reference: "G-017", slotsFilled: 3, totalSlots: 10, startDate: "2026-06-01", status: "open" },
  { id: "2", reference: "G-016", slotsFilled: 8, totalSlots: 10, startDate: "2026-05-20", status: "open" },
  { id: "3", reference: "G-015", slotsFilled: 10, totalSlots: 10, startDate: "2026-05-01", status: "full" },
  { id: "4", reference: "G-014", slotsFilled: 10, totalSlots: 10, startDate: "2026-04-01", status: "completed" },
];

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });

const HOW_IT_WORKS = [
  { icon: Banknote, title: "Pay daily per slot", body: `Transfer ${naira(SLOT_DAILY)} per slot each day to our bank account.` },
  { icon: MessageCircle, title: "Send your screenshot", body: "Share it on WhatsApp so we can confirm and log it." },
  { icon: Target, title: "Receive by position", body: "Items are delivered in group position order as funds build." },
];

function JoinGroupConfirmInner() {
  const user = useUserStore((s) => s.user);
  const params = useParams();
  const search = useSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const group = MOCK_GROUPS.find((g) => g.id === id);

  /* Optional deep-linked target item from a product page. */
  const itemName = search.get("name");
  const itemPrice = Number(search.get("price"));
  const itemImage = search.get("image");
  const hasItem = Boolean(itemName) && itemPrice > 0;

  /* Slots: a prefilled item fixes the slot count (1 or 2); otherwise the
     customer chooses, capped at the per-customer group maximum. */
  const itemSlots = hasItem ? groupSlotsForPrice(itemPrice) : 1;
  const [slots, setSlots] = useState<number>(itemSlots);
  const effectiveSlots = hasItem ? itemSlots : slots;
  const daily = dailyForSlots(effectiveSlots);

  const [step, setStep] = useState<"confirm" | "done">("confirm");

  /* ---------------------------- AUTH GATE --------------------------- */
  if (!user) {
    return (
      <AuthRequired
        title="Log in to join a group"
        description="You need an account to join a group and track your Pay Small Small plan. It only takes a minute."
      />
    );
  }

  /* ---------------------------- NOT FOUND --------------------------- */
  if (!group) {
    return (
      <div className="py-8 sm:py-12">
        <Container className="max-w-2xl">
          <Link href="/pay-small-small/join" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6 gap-2")}>
            <ArrowLeft className="size-4" /> Back to groups
          </Link>
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-h3 font-semibold mb-2">Group not found</p>
            <p className="text-body-sm text-muted-foreground mb-5">
              This group doesn&apos;t exist or is no longer available. Browse the open groups instead.
            </p>
            <Link href="/pay-small-small/join" className={cn(buttonVariants({ variant: "outline" }), "gap-2")}>
              See open groups
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  /* ----------------- ITEM ABOVE GROUP CAP (ineligible) -------------- */
  if (hasItem && !isGroupEligible(itemPrice)) {
    return (
      <div className="py-8 sm:py-12">
        <Container className="max-w-2xl">
          <Link href="/pay-small-small/join" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6 gap-2")}>
            <ArrowLeft className="size-4" /> Back to groups
          </Link>
          <div className="rounded-2xl border border-warning/30 bg-warning/5 p-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-warning/15 mx-auto mb-4">
              <AlertTriangle className="size-7 text-warning" />
            </div>
            <h1 className="text-h2 font-bold mb-2">This item needs a solo plan</h1>
            <p className="text-body-sm text-muted-foreground mb-6 max-w-[44ch] mx-auto">
              {itemName} costs {naira(itemPrice)}. Group plans only cover items up to {naira(GROUP_PRICE_CAP)}.
              A solo plan has no price cap — start one and pay {naira(SLOT_DAILY)} per slot per day.
            </p>
            <Link
              href={`/pay-small-small/solo?${search.toString()}`}
              className={cn(buttonVariants(), "gap-2")}
            >
              Start a solo plan instead <ArrowRight className="size-4" />
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const slotsLeft = group.totalSlots - group.slotsFilled;
  const isOpen = group.status === "open";
  const maxSelectable = Math.min(GROUP_MAX_SLOTS_PER_CUSTOMER, slotsLeft);
  const firstPosition = group.slotsFilled + 1;

  /* ------------------------- CLOSED (full/done) --------------------- */
  if (!isOpen) {
    return (
      <div className="py-8 sm:py-12">
        <Container className="max-w-2xl">
          <Link href="/pay-small-small/join" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6 gap-2")}>
            <ArrowLeft className="size-4" /> Back to groups
          </Link>
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted mx-auto mb-4">
              <Lock className="size-7 text-muted-foreground" />
            </div>
            <h1 className="text-h2 font-bold mb-2">
              {group.reference} is {group.status === "full" ? "full" : "completed"}
            </h1>
            <p className="text-body-sm text-muted-foreground mb-6 max-w-[42ch] mx-auto">
              {group.status === "full"
                ? "Every slot in this group has been taken. Try another open group, or start a solo plan with no waiting."
                : "This group has finished its savings cycle. Join an open group or start your own solo plan."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/pay-small-small/join" className={cn(buttonVariants(), "gap-2")}>
                <Users className="size-4" /> See open groups
              </Link>
              <Link href="/pay-small-small/solo" className={cn(buttonVariants({ variant: "outline" }), "gap-2")}>
                Start a solo plan
              </Link>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  /* ------------------------------ DONE ------------------------------ */
  if (step === "done") {
    return (
      <div className="py-20">
        <Container className="max-w-sm">
          <div className="text-center py-12">
            <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 mx-auto mb-5">
              <CheckCircle className="size-10 text-primary" />
            </div>
            <h1 className="text-h2 font-bold mb-2">You&apos;ve joined {group.reference}!</h1>
            <p className="text-body-sm text-muted-foreground mb-8">
              You hold {effectiveSlots} slot{effectiveSlots !== 1 ? "s" : ""} (position{effectiveSlots !== 1 ? "s" : ""}{" "}
              {effectiveSlots === 1 ? firstPosition : `${firstPosition}–${firstPosition + effectiveSlots - 1}`}).
              Pay {naira(daily)} daily and track progress on the My Plan page.
            </p>
            <Link href="/pay-small-small/my-plan" className={cn(buttonVariants({ size: "lg" }), "w-full gap-2 justify-center")}>
              Go to My Plan <ArrowRight className="size-4" />
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  /* ---------------------------- CONFIRM ----------------------------- */
  return (
    <div className="py-8 sm:py-12">
      <Container className="max-w-2xl">
        <Link href="/pay-small-small/join" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6 gap-2")}>
          <ArrowLeft className="size-4" /> Back to groups
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <Users className="size-5 text-primary" />
          </div>
          <h1 className="text-h1 font-bold">Join {group.reference}</h1>
        </div>
        <p className="text-body-sm text-muted-foreground mb-8">
          Take 1 or 2 slots and confirm your daily commitment. Each slot is {naira(SLOT_DAILY)}/day.
        </p>

        {/* Group summary */}
        <div className="rounded-2xl border border-border bg-card p-5 mb-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <span className="text-body font-bold font-mono">{group.reference}</span>
            <Badge variant="success" className="text-micro">Open</Badge>
          </div>

          <div className="flex items-center gap-4 text-body-sm text-muted-foreground flex-wrap mb-3">
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5" /> {group.slotsFilled}/{group.totalSlots} slots
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5" /> Starts {formatDate(group.startDate)}
            </span>
          </div>

          {/* Slot fill bar */}
          <div className="flex gap-1 mb-1.5">
            {Array.from({ length: group.totalSlots }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 flex-1 rounded-full",
                  i < group.slotsFilled
                    ? "bg-primary"
                    : i < group.slotsFilled + effectiveSlots
                    ? "bg-accent"
                    : "bg-muted",
                )}
              />
            ))}
          </div>
          <p className="text-caption text-primary font-medium">
            {slotsLeft} slot{slotsLeft !== 1 ? "s" : ""} remaining — you&apos;d take position
            {effectiveSlots !== 1 ? "s" : ""}{" "}
            {effectiveSlots === 1 ? firstPosition : `${firstPosition}–${firstPosition + effectiveSlots - 1}`}
          </p>
        </div>

        {/* Target item (if deep-linked) */}
        {hasItem && (
          <div className="rounded-2xl border border-border bg-card p-5 mb-5">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-xl overflow-hidden border border-border flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={itemImage || ""} alt={itemName || ""} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-caption font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Saving toward</p>
                <p className="text-body-sm font-semibold line-clamp-2">{itemName}</p>
                <p className="text-body font-bold text-primary">{naira(itemPrice)} · {itemSlots} slot{itemSlots !== 1 ? "s" : ""}</p>
              </div>
            </div>
          </div>
        )}

        {/* Slot picker (only when not fixed by a target item) */}
        {!hasItem && (
          <div className="mb-5">
            <h2 className="text-body font-semibold mb-3">How many slots?</h2>
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: Math.max(1, maxSelectable) }).map((_, i) => {
                const value = i + 1;
                return (
                  <button
                    key={value}
                    onClick={() => setSlots(value)}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition-all duration-200",
                      slots === value
                        ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                        : "border-border bg-card hover:border-primary/40",
                    )}
                  >
                    <p className="text-body font-bold">{value} slot{value !== 1 ? "s" : ""}</p>
                    <p className="text-caption text-muted-foreground">{naira(dailyForSlots(value))}/day</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Your commitment */}
        <div className="rounded-2xl border border-border bg-muted/50 p-5 mb-5">
          <h2 className="text-body font-semibold mb-3">Your commitment</h2>
          <div className="space-y-2 text-body-sm">
            {[
              ["Slots", `${effectiveSlots}`],
              ["Daily payment", `${naira(daily)}/day`],
              ["Cycle", `${CYCLE_DAYS} days`],
              ["Value per slot/cycle", naira(SLOT_CYCLE_VALUE)],
              ["Plan type", `Group ${group.reference}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-semibold">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <h2 className="text-body font-semibold mb-3">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {HOW_IT_WORKS.map((s) => (
            <div key={s.title} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 mb-3">
                <s.icon className="size-4 text-primary" />
              </div>
              <p className="text-body-sm font-semibold mb-1">{s.title}</p>
              <p className="text-caption text-muted-foreground leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        <p className="text-caption text-muted-foreground mb-5">
          By joining you agree to pay {naira(daily)}/day (strictly the daily amount — no paying ahead). Missing a day
          just pauses your progress. When you complete a cycle you&apos;ll choose to continue or convert to a product —
          money is never withdrawn as cash.
        </p>

        <Button size="lg" className="w-full gap-2" onClick={() => setStep("done")}>
          <Users className="size-5" /> Join {group.reference}
        </Button>

        <p className="text-caption text-muted-foreground text-center mt-3">
          By joining you agree to the{" "}
          <Link href="/pay-small-small/group-terms" className="text-primary underline underline-offset-2">
            Group Savings Plan Terms &amp; Conditions
          </Link>
          .
        </p>
      </Container>
    </div>
  );
}

export default function JoinGroupConfirmPage() {
  return (
    <Suspense fallback={<div className="py-20" />}>
      <JoinGroupConfirmInner />
    </Suspense>
  );
}
