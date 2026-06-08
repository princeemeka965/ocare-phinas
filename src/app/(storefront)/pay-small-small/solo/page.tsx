"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { User, ArrowLeft, ArrowRight, CheckCircle, Truck, CalendarClock } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import { toast } from "@/store/toastStore";
import { useUserStore } from "@/store/userStore";
import { AuthRequired } from "@/components/storefront/auth-required";
import { ActivePlanNotice } from "@/components/storefront/active-plan-notice";
import {
  DeliveryFields,
  emptyDeliveryForm,
  deliveryFormValid,
  deliveryShipping,
  type DeliveryForm,
} from "@/components/storefront/delivery-fields";
import {
  soloPlanMath,
  naira,
  suggestedSoloAmount,
  isPlanOngoing,
  SOLO_FREQUENCIES,
  type SoloFrequency,
} from "@/lib/pay-small-small";

/** Minimal shape of a plan from /api/me/plans, for the one-per-type cap check. */
interface MyPlan {
  type: "solo" | "group";
  status: string;
  productName: string | null;
}

/* ------------------------------------------------------------------ */
/* Solo Plan (payment-flow §3, §5.2)                                   */
/* Pick ANY item at its real price, then choose how AND when to pay:    */
/* any amount, paid daily, weekly or monthly. Pay more to finish faster */
/* or less to keep it gentle. We deliver at 50%; you finish the balance */
/* after. No price cap.                                                 */
/* ------------------------------------------------------------------ */

const FREQUENCY_ORDER: SoloFrequency[] = ["daily", "weekly", "monthly"];

interface SoloItem {
  id: string;
  name: string;
  price: number;
  image: string;
}

const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=200&h=200&fit=crop&q=80";

function SoloPlanInner() {
  const user = useUserStore((s) => s.user);

  /* A product page can deep-link here with a chosen item:
     /pay-small-small/solo?productId=…&name=…&price=…&image=… — we preselect it. */
  const params = useSearchParams();
  const prefillId = params.get("productId");
  const prefillName = params.get("name");
  const prefillPrice = Number(params.get("price"));
  const prefill: SoloItem | null =
    prefillId && prefillName && prefillPrice > 0
      ? { id: prefillId, name: prefillName, price: prefillPrice, image: params.get("image") || PLACEHOLDER_IMG }
      : null;

  /* Catalog items the customer can put on a solo plan (real products). */
  const [items, setItems] = useState<SoloItem[]>([]);
  const [starting, setStarting] = useState(false);

  /* The customer's existing plans — used to enforce one ongoing solo plan (§1).
     `null` while loading; `[]` when signed out or none. */
  const [myPlans, setMyPlans] = useState<MyPlan[] | null>(null);

  /* Door delivery vs. store pickup — the fee (delivery only) folds into the plan total. */
  const [delivery, setDelivery] = useState<DeliveryForm>(emptyDeliveryForm);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryError, setDeliveryError] = useState(false);

  useEffect(() => {
    api
      .get<{ products: { id: string; name: string; price: number; images: string[] }[] }>("/api/products?limit=40&sort=price_desc")
      .then((d) => setItems(d.products.map((p) => ({ id: p.id, name: p.name, price: p.price, image: p.images[0] ?? PLACEHOLDER_IMG }))))
      .catch(() => setItems([]));
    api
      .get<{ settings: { deliveryFee: number } }>("/api/settings")
      .then((d) => setDeliveryFee(d.settings.deliveryFee))
      .catch(() => {});
    api
      .get<{ plans: MyPlan[] }>("/api/me/plans")
      .then((d) => setMyPlans(d.plans))
      .catch(() => setMyPlans([]));
  }, []);

  /* An ongoing solo plan blocks starting another (a group plan does not). */
  const ongoingSolo = myPlans?.find((p) => p.type === "solo" && isPlanOngoing(p.status)) ?? null;

  const fee = delivery.method === "delivery" ? deliveryFee : 0;

  /* Effective list: the deep-linked item first, then the catalog. */
  const itemList = prefill ? [prefill, ...items.filter((i) => i.id !== prefill.id)] : items;

  const [step, setStep] = useState<"pick" | "configure" | "done">(prefill ? "configure" : "pick");
  const [selectedItem, setSelectedItem] = useState<string | null>(prefill ? prefill.id : null);

  /* How often the customer pays: daily, weekly or monthly. */
  const [frequency, setFrequency] = useState<SoloFrequency>("daily");

  /* Customer-chosen amount per payment. Seeded with a sensible suggestion for
     the item + frequency, but the customer is free to change it. */
  const [amountInput, setAmountInput] = useState<string>(
    prefill ? String(suggestedSoloAmount(prefill.price, "daily")) : "",
  );

  const freqMeta = SOLO_FREQUENCIES[frequency];
  const selected = itemList.find((i) => i.id === selectedItem);
  const amount = Number(amountInput);
  const amountValid =
    !!selected && amount >= freqMeta.min && amount <= selected.price;
  const math = selected && amount > 0 ? soloPlanMath(selected.price, amount, frequency) : null;

  /* Move to the configure step with a sensible default amount for the item. */
  function pickItem(id: string, price: number) {
    setSelectedItem(id);
    setAmountInput(String(suggestedSoloAmount(price, frequency)));
    setStep("configure");
  }

  /* Switching frequency re-seeds the amount with that period's suggestion. */
  function chooseFrequency(next: SoloFrequency) {
    setFrequency(next);
    if (selected) setAmountInput(String(suggestedSoloAmount(selected.price, next)));
  }

  /* Create the solo plan server-side, then show the success step. */
  async function startPlan() {
    if (!selected || !amountValid) return;
    if (!deliveryFormValid(delivery)) {
      setDeliveryError(true);
      toast.error("Add your delivery address, or choose store pickup.");
      return;
    }
    setDeliveryError(false);
    setStarting(true);
    try {
      await api.post("/api/plans", {
        productId: selected.id,
        perPayment: amount,
        frequency,
        deliveryMethod: delivery.method,
        shipping: deliveryShipping(delivery),
      });
      setStep("done");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't start your plan. Please try again.");
    } finally {
      setStarting(false);
    }
  }

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
  if (step === "done" && selected && math) {
    return (
      <div className="py-20">
        <Container className="max-w-sm">
          <div className="text-center py-12">
            <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 mx-auto mb-5">
              <CheckCircle className="size-10 text-primary" />
            </div>
            <h1 className="text-h2 font-bold mb-2">Solo plan started!</h1>
            <p className="text-body-sm text-muted-foreground mb-8">
              Your plan for the {selected.name} is active. Pay {naira(math.amount)} every{" "}
              {freqMeta.unit} and track your progress on the My Plan page — we deliver once you
              reach 50%.
            </p>
            <Link href="/pay-small-small/my-plan" className={cn(buttonVariants({ size: "lg" }), "w-full gap-2 justify-center")}>
              Go to My Plan <ArrowRight className="size-4" />
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  /* ---------------- ALREADY HAS AN ONGOING SOLO PLAN -------------- */
  /* One ongoing solo plan at a time (§1). A running group plan is fine. */
  if (ongoingSolo) {
    return <ActivePlanNotice type="solo" productName={ongoingSolo.productName} />;
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

          <h1 className="text-h1 font-bold mb-1">Confirm your plan</h1>
          <p className="text-body-sm text-muted-foreground mb-6">
            Choose how much to pay and how often — daily, weekly or monthly. Pay more to finish
            faster, or keep it gentle. We deliver once you reach 50%, then you finish the balance.
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

          {/* How & when to pay — chosen by the customer */}
          <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-5 mb-6">
            {/* When — frequency */}
            <p className="text-caption font-semibold uppercase tracking-wide text-muted-foreground">
              How often will you pay?
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {FREQUENCY_ORDER.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => chooseFrequency(f)}
                  aria-pressed={frequency === f}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-body-sm font-semibold transition-colors",
                    frequency === f
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40",
                  )}
                >
                  {SOLO_FREQUENCIES[f].label}
                </button>
              ))}
            </div>

            {/* How much — amount per payment */}
            <label
              htmlFor="amount"
              className="mt-5 block text-caption font-semibold uppercase tracking-wide text-muted-foreground"
            >
              How much per {freqMeta.unit}?
            </label>
            <div className="relative mt-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-h2 font-bold text-primary">₦</span>
              <input
                id="amount"
                type="number"
                inputMode="numeric"
                min={freqMeta.min}
                max={selected.price}
                step={100}
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder={String(suggestedSoloAmount(selected.price, frequency))}
                className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-16 text-h2 font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-body-sm font-medium text-muted-foreground">
                {freqMeta.per}
              </span>
            </div>
            <p className="text-caption text-muted-foreground mt-2">
              Per {freqMeta.unit} — minimum {naira(freqMeta.min)}. You decide the pace.
            </p>

            {/* Quick picks — scaled to the chosen frequency */}
            <div className="flex flex-wrap gap-2 mt-3">
              {[1, 2, 5, 10].map((mult) => {
                const amt = 1000 * freqMeta.days * mult;
                return (
                  <button
                    key={mult}
                    type="button"
                    onClick={() => setAmountInput(String(amt))}
                    className={cn(
                      "rounded-full border px-3 py-1 text-caption font-semibold transition-colors",
                      amount === amt
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40",
                    )}
                  >
                    {naira(amt)}
                    {freqMeta.per}
                  </button>
                );
              })}
            </div>
          </div>

          {/* How would you like to receive it? */}
          <div className="rounded-2xl border border-border bg-card p-5 mb-6">
            <h2 className="text-body font-semibold mb-1">How would you like to receive it?</h2>
            <p className="text-caption text-muted-foreground mb-4">
              Choose door delivery or free store pickup — a delivery fee folds into your plan total.
            </p>
            <DeliveryFields
              value={delivery}
              onChange={setDelivery}
              errors={
                deliveryError
                  ? { state: "Required", city: "Required", address: "Enter your delivery address." }
                  : undefined
              }
            />
          </div>

          {/* Plan summary */}
          {math && amountValid ? (
            <div className="rounded-2xl border border-border bg-muted/50 p-5 mb-6 space-y-3">
              <div className="flex items-center gap-2 text-body-sm font-semibold">
                <CalendarClock className="size-4 text-primary" />
                Your plan
              </div>
              <div className="space-y-2 text-body-sm">
                {[
                  ["Payment", `${naira(math.amount)}${freqMeta.per}`],
                  ["Item price", naira(selected.price)],
                  ["Delivery", fee > 0 ? naira(fee) : "Free (pickup)"],
                  ["Total to pay", naira(selected.price + fee)],
                  [
                    "Payments to fully pay",
                    `${Math.ceil((selected.price + fee) / amount)} ${freqMeta.unit}${Math.ceil((selected.price + fee) / amount) !== 1 ? "s" : ""} (${Math.ceil((selected.price + fee) / amount) * freqMeta.days} days)`,
                  ],
                  ["Plan type", `Solo · ${freqMeta.label.toLowerCase()}`],
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
                  We deliver your item once you&apos;ve paid <span className="font-semibold text-foreground">{naira(math.deliveryTarget)}</span> (50% of the item)
                  — about <span className="font-semibold text-foreground">{math.paymentsToDelivery} {freqMeta.unit}{math.paymentsToDelivery !== 1 ? "s" : ""}</span> in.
                  You then finish the balance{fee > 0 ? " (including delivery)" : ""}.
                </span>
              </div>
            </div>
          ) : (
            <p className="text-caption text-destructive mb-6">
              Enter an amount between {naira(freqMeta.min)} and {naira(selected.price)} to see your plan.
            </p>
          )}

          <p className="text-caption text-muted-foreground mb-5">
            No interest, no penalties. Missing a payment just pauses your progress. Money paid in can only ever become a
            product — there are no withdrawals. You can run one solo plan and one group plan at a time — finish a solo
            plan before starting another.
          </p>

          <Button size="lg" className="w-full gap-2" disabled={!math || !amountValid || starting} onClick={startPlan}>
            <User className="size-5" /> {starting ? "Starting…" : "Start my solo plan"}
          </Button>

          <p className="text-caption text-muted-foreground text-center mt-3">
            By starting a plan you agree to the{" "}
            <Link href="/pay-small-small/solo-terms" className="text-primary underline underline-offset-2">
              Solo Plan Terms &amp; Conditions
            </Link>
            .
          </p>
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
          Pick any item — from a ₦12,000 fan to a ₦350,000 freezer — then choose how much to pay and how often:
          daily, weekly or monthly. Pay more to finish faster, or keep it gentle. We deliver once you&apos;re halfway.
        </p>

        <h2 className="text-body font-semibold mb-4">Pick your item</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
          {itemList.map((item) => (
            <button
              key={item.id}
              onClick={() => pickItem(item.id, item.price)}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left transition-all duration-200 hover:border-primary/40 hover:shadow-md"
            >
              <div className="size-14 rounded-xl overflow-hidden border border-border flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-semibold line-clamp-2">{item.name}</p>
                <p className="text-body font-bold text-primary mt-0.5">{naira(item.price)}</p>
                <p className="text-caption text-muted-foreground">pay daily, weekly or monthly · you choose the pace</p>
              </div>
              <ArrowRight className="size-5 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>

        <p className="text-caption text-muted-foreground mt-4">
          You choose how much and how often — daily, weekly or monthly. We deliver at 50%; you finish the balance after.
        </p>
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
