"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { User, ArrowLeft, ArrowRight, CheckCircle, Truck, CalendarClock } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/userStore";
import { AuthRequired } from "@/components/storefront/auth-required";

/* ------------------------------------------------------------------ */
/* Solo plan = flexible layaway (CDcare style)                         */
/* Pick ANY item at its real price, choose how often and how much you  */
/* pay. No fixed daily amount, no ₦50k cap. We deliver once you reach  */
/* the halfway mark, then you finish the balance.                      */
/* ------------------------------------------------------------------ */

const DELIVERY_THRESHOLD = 0.5; // item ships once 50% is paid

type Frequency = "daily" | "weekly" | "monthly";

const FREQUENCIES: { value: Frequency; label: string; unit: string }[] = [
  { value: "daily", label: "Daily", unit: "day" },
  { value: "weekly", label: "Weekly", unit: "week" },
  { value: "monthly", label: "Monthly", unit: "month" },
];

/* Mock eligible items — replace with DB query in Phase 3.
   Includes big-ticket appliances so any budget/price works. */
const ITEMS = [
  { id: "f1", name: "Haier Thermocool Chest Freezer 300L", price: 350000, image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=200&h=200&fit=crop&q=80" },
  { id: "f2", name: "Hisense Double-Door Refrigerator", price: 285000, image: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=200&h=200&fit=crop&q=80" },
  { id: "f3", name: "LG 1.5HP Split Air Conditioner", price: 240000, image: "https://images.unsplash.com/photo-1631545806609-c2b999f7d8c0?w=200&h=200&fit=crop&q=80" },
  { id: "8", name: 'LG OLED evo C3 55" 4K Smart TV', price: 89990, image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=200&h=200&fit=crop&q=80" },
  { id: "13", name: "Sony PlayStation 5 Slim", price: 56000, image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=200&h=200&fit=crop&q=80" },
  { id: "10", name: "Panasonic Microwave Oven 20L", price: 18900, image: "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=200&h=200&fit=crop&q=80" },
  { id: "7", name: "Sony WH-1000XM5 Headphones", price: 22990, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop&q=80" },
  { id: "9", name: "Binatone Standing Fan 16-inch", price: 12500, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop&q=80" },
];

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

/** A sensible starting per-cycle amount: ~3 months of payments at the chosen
    frequency, rounded to a clean figure. The customer can change it freely. */
function suggestAmount(price: number, freq: Frequency): number {
  const cycles = freq === "daily" ? 90 : freq === "weekly" ? 13 : 3;
  const raw = price / cycles;
  const step = raw >= 5000 ? 1000 : 500;
  return Math.max(step, Math.ceil(raw / step) * step);
}

const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=200&h=200&fit=crop&q=80";

function SoloPlanInner() {
  const user = useUserStore((s) => s.user);

  /* A product page can deep-link here with a chosen item (CDcare-style):
     /pay-small-small/solo?name=…&price=…&image=… — we preselect it. */
  const params = useSearchParams();
  const prefillName = params.get("name");
  const prefillPrice = Number(params.get("price"));
  const prefill =
    prefillName && prefillPrice > 0
      ? { id: "prefill", name: prefillName, price: prefillPrice, image: params.get("image") || PLACEHOLDER_IMG }
      : null;

  /* Effective list: the deep-linked item first, then the curated picks. */
  const itemList = prefill ? [prefill, ...ITEMS.filter((i) => i.name !== prefill.name)] : ITEMS;

  const [step, setStep] = useState<"pick" | "configure" | "done">(prefill ? "configure" : "pick");
  const [selectedItem, setSelectedItem] = useState<string | null>(prefill ? prefill.id : null);
  const [frequency, setFrequency] = useState<Frequency>("daily");
  const [amount, setAmount] = useState<number>(prefill ? suggestAmount(prefill.price, "daily") : 0);

  const selected = itemList.find((i) => i.id === selectedItem);
  const freqMeta = FREQUENCIES.find((f) => f.value === frequency)!;

  /* --- derived plan maths --- */
  const perCycle = amount > 0 ? amount : 0;
  const payments = selected && perCycle > 0 ? Math.ceil(selected.price / perCycle) : 0;
  const deliveryTarget = selected ? selected.price * DELIVERY_THRESHOLD : 0;
  const paymentsToDelivery = selected && perCycle > 0 ? Math.ceil(deliveryTarget / perCycle) : 0;

  const startConfigure = (id: string) => {
    const item = itemList.find((i) => i.id === id)!;
    setSelectedItem(id);
    setAmount(suggestAmount(item.price, frequency));
    setStep("configure");
  };

  const changeFrequency = (f: Frequency) => {
    setFrequency(f);
    if (selected) setAmount(suggestAmount(selected.price, f));
  };

  /* --------------------------- AUTH GATE --------------------------- */
  if (!user) {
    const qs = params.toString();
    const next = qs ? `/pay-small-small/solo?${qs}` : "/pay-small-small/solo";
    return (
      <AuthRequired
        title="Log in to start a solo plan"
        description="You need an account to start and track a Pay Small Small plan. It only takes a minute."
        next={next}
      />
    );
  }

  /* ----------------------------- DONE ----------------------------- */
  if (step === "done" && selected) {
    return (
      <div className="py-20">
        <Container className="max-w-sm">
          <div className="text-center py-12">
            <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 mx-auto mb-5">
              <CheckCircle className="size-10 text-primary" />
            </div>
            <h1 className="text-h2 font-bold mb-2">Solo plan started!</h1>
            <p className="text-body-sm text-muted-foreground mb-8">
              Your plan for the {selected.name} is active. Pay {naira(perCycle)} {frequency} and
              track your progress on the My Plan page — we deliver once you reach the halfway mark.
            </p>
            <Link href="/pay-small-small/my-plan" className={cn(buttonVariants({ size: "lg" }), "w-full gap-2 justify-center")}>
              Go to My Plan <ArrowRight className="size-4" />
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  /* -------------------------- CONFIGURE --------------------------- */
  if (step === "configure" && selected) {
    return (
      <div className="py-8 sm:py-12">
        <Container className="max-w-2xl">
          <button
            onClick={() => setStep("pick")}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6 gap-2")}
          >
            <ArrowLeft className="size-4" /> Back
          </button>

          <h1 className="text-h1 font-bold mb-1">Set up your plan</h1>
          <p className="text-body-sm text-muted-foreground mb-6">
            Choose how often and how much you want to pay. It&apos;s entirely up to your budget.
          </p>

          {/* Item */}
          <div className="rounded-2xl border border-border bg-card p-5 mb-6">
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-xl overflow-hidden border border-border flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selected.image} alt={selected.name} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-body-sm font-semibold line-clamp-2">{selected.name}</p>
                <p className="text-body font-bold text-primary">{naira(selected.price)}</p>
              </div>
            </div>
          </div>

          {/* Frequency */}
          <h2 className="text-body font-semibold mb-3">How often will you pay?</h2>
          <div className="grid grid-cols-3 gap-2 mb-6">
            {FREQUENCIES.map((f) => (
              <button
                key={f.value}
                onClick={() => changeFrequency(f.value)}
                className={cn(
                  "rounded-xl border py-3 text-body-sm font-semibold transition-all duration-200",
                  frequency === f.value
                    ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/30"
                    : "border-border bg-card hover:border-primary/40",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Amount */}
          <h2 className="text-body font-semibold mb-3">How much per {freqMeta.unit}?</h2>
          <div className="relative mb-3">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-body font-semibold text-muted-foreground">₦</span>
            <input
              type="number"
              inputMode="numeric"
              min={500}
              step={500}
              value={amount || ""}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
              className="w-full rounded-xl border border-border bg-card py-3.5 pl-9 pr-4 text-body font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              placeholder="Enter amount"
            />
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            {[2000, 5000, 10000, 20000].map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(preset)}
                className={cn(
                  "rounded-full border px-3 py-1 text-caption font-medium transition-colors",
                  amount === preset
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40",
                )}
              >
                {naira(preset)}
              </button>
            ))}
          </div>

          {/* Live summary */}
          {perCycle > 0 && (
            <div className="rounded-2xl border border-border bg-muted/50 p-5 mb-6 space-y-3">
              <div className="flex items-center gap-2 text-body-sm font-semibold">
                <CalendarClock className="size-4 text-primary" />
                Your plan
              </div>
              <div className="space-y-2 text-body-sm">
                {[
                  ["Payment", `${naira(perCycle)} ${frequency}`],
                  ["Item price", naira(selected.price)],
                  ["Estimated payments", `${payments} ${freqMeta.unit}${payments !== 1 ? "s" : ""}`],
                  ["Plan type", "Solo (flexible)"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-semibold text-right">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2 rounded-xl bg-primary/5 border border-primary/20 p-3 text-caption">
                <Truck className="size-4 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">
                  We deliver your item once you&apos;ve paid <span className="font-semibold text-foreground">{naira(deliveryTarget)}</span> (50%)
                  — about <span className="font-semibold text-foreground">{paymentsToDelivery} payment{paymentsToDelivery !== 1 ? "s" : ""}</span> in.
                  You then finish the balance at your own pace.
                </span>
              </div>
            </div>
          )}

          <p className="text-caption text-muted-foreground mb-5">
            No interest, no penalties. Missing a payment just pauses your progress. You can only have
            one active plan at a time.
          </p>

          <Button
            size="lg"
            className="w-full gap-2"
            disabled={perCycle < 500}
            onClick={() => setStep("done")}
          >
            <User className="size-5" /> Start my solo plan
          </Button>
        </Container>
      </div>
    );
  }

  /* ----------------------------- PICK ----------------------------- */
  return (
    <div className="py-8 sm:py-12">
      <Container className="max-w-4xl">
        <Link href="/pay-small-small" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6 gap-2")}>
          <ArrowLeft className="size-4" /> Pay Small Small
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10">
            <User className="size-5 text-accent" />
          </div>
          <h1 className="text-h1 font-bold">Start a Solo Plan</h1>
        </div>
        <p className="text-body-sm text-muted-foreground mb-8 max-w-2xl">
          Pick any item — from a ₦12,000 fan to a ₦350,000 freezer. Then choose how often and how much
          you pay. No fixed amount, no target cap. We deliver once you&apos;re halfway there.
        </p>

        <h2 className="text-body font-semibold mb-4">Pick your item</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
          {itemList.map((item) => (
            <button
              key={item.id}
              onClick={() => startConfigure(item.id)}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left transition-all duration-200 hover:border-primary/40 hover:shadow-md"
            >
              <div className="size-14 rounded-xl overflow-hidden border border-border flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-semibold line-clamp-2">{item.name}</p>
                <p className="text-body font-bold text-primary mt-0.5">{naira(item.price)}</p>
              </div>
              <ArrowRight className="size-5 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>
      </Container>
    </div>
  );
}

export default function SoloPlanPage() {
  return (
    <Suspense fallback={<div className="py-20" />}>
      <SoloPlanInner />
    </Suspense>
  );
}
