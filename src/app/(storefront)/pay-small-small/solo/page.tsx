"use client";

import { useState } from "react";
import Link from "next/link";
import { User, ArrowLeft, Search, ArrowRight, CheckCircle } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DAILY_AMOUNT = 1000;
const DURATION = 50;
const TARGET_VALUE = DAILY_AMOUNT * DURATION;

/* Mock eligible items — replace with DB query in Phase 3 */
const ITEMS = [
  { id: "7", name: "Binatone Standing Fan 16-inch", price: 12500, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop&q=80" },
  { id: "9", name: "Panasonic Microwave Oven 20L", price: 18900, image: "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=200&h=200&fit=crop&q=80" },
  { id: "10", name: "Sony WH-1000XM5 Headphones", price: 22990, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop&q=80" },
  { id: "11", name: "Tecno Camon 20 Pro", price: 19500, image: "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=200&h=200&fit=crop&q=80" },
];

export default function SoloPlanPage() {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [step, setStep] = useState<"pick" | "confirm" | "done">("pick");

  const selected = ITEMS.find((i) => i.id === selectedItem);

  if (step === "done") {
    return (
      <div className="py-20">
        <Container className="max-w-sm">
          <div className="text-center py-12">
            <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 mx-auto mb-5">
              <CheckCircle className="size-10 text-primary" />
            </div>
            <h1 className="text-h2 font-bold mb-2">Solo plan started!</h1>
            <p className="text-body-sm text-muted-foreground mb-8">
              Your plan is active. Pay ₦{DAILY_AMOUNT.toLocaleString("en-NG")} daily and track your progress on the My Plan page.
            </p>
            <Link href="/pay-small-small/my-plan" className={cn(buttonVariants({ size: "lg" }), "w-full gap-2 justify-center")}>
              Go to My Plan <ArrowRight className="size-4" />
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  if (step === "confirm" && selected) {
    return (
      <div className="py-8 sm:py-12">
        <Container className="max-w-sm">
          <button
            onClick={() => setStep("pick")}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6 gap-2")}
          >
            <ArrowLeft className="size-4" /> Back
          </button>

          <h1 className="text-h1 font-bold mb-6">Confirm your plan</h1>

          <div className="rounded-2xl border border-border bg-card p-5 mb-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="size-16 rounded-xl overflow-hidden border border-border flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selected.image} alt={selected.name} className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="text-body-sm font-semibold">{selected.name}</p>
                <p className="text-body font-bold text-primary">₦{selected.price.toLocaleString("en-NG")}</p>
              </div>
            </div>

            <div className="space-y-2 text-body-sm">
              {[
                ["Daily saving", `₦${DAILY_AMOUNT.toLocaleString("en-NG")}`],
                ["Duration", `${DURATION} days`],
                ["Total savings", `₦${TARGET_VALUE.toLocaleString("en-NG")}`],
                ["Plan type", "Solo (no group)"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-caption text-muted-foreground mb-5">
            By starting a plan you agree to save ₦{DAILY_AMOUNT.toLocaleString("en-NG")}/day. You can only have one active plan at a time.
          </p>

          <Button
            size="lg"
            className="w-full gap-2"
            onClick={() => setStep("done")}
          >
            <User className="size-5" /> Start my solo plan
          </Button>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12">
      <Container className="max-w-2xl">
        <Link href="/pay-small-small" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6 gap-2")}>
          <ArrowLeft className="size-4" /> Pay Small Small
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10">
            <User className="size-5 text-accent" />
          </div>
          <h1 className="text-h1 font-bold">Start a Solo Plan</h1>
        </div>
        <p className="text-body-sm text-muted-foreground mb-8">
          Pick the item you&apos;re saving toward. Save ₦{DAILY_AMOUNT.toLocaleString("en-NG")}/day for {DURATION} days and it&apos;s yours.
        </p>

        <div className="rounded-xl border border-border bg-muted/50 p-4 mb-8">
          <div className="flex items-center gap-6 text-center justify-around">
            <div>
              <p className="text-h3 font-bold text-primary">₦{DAILY_AMOUNT.toLocaleString("en-NG")}</p>
              <p className="text-caption text-muted-foreground">per day</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-h3 font-bold text-primary">{DURATION}</p>
              <p className="text-caption text-muted-foreground">days</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-h3 font-bold text-primary">₦{TARGET_VALUE.toLocaleString("en-NG")}</p>
              <p className="text-caption text-muted-foreground">target</p>
            </div>
          </div>
        </div>

        <h2 className="text-body font-semibold mb-4">Pick your target item</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedItem(item.id)}
              className={cn(
                "flex items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200 hover:shadow-md",
                selectedItem === item.id
                  ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              <div className="size-14 rounded-xl overflow-hidden border border-border flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-semibold line-clamp-2">{item.name}</p>
                <p className="text-body font-bold text-primary mt-0.5">₦{item.price.toLocaleString("en-NG")}</p>
              </div>
              {selectedItem === item.id && (
                <CheckCircle className="size-5 text-primary flex-shrink-0" />
              )}
            </button>
          ))}
        </div>

        <Button
          size="lg"
          className="w-full gap-2"
          disabled={!selectedItem}
          onClick={() => setStep("confirm")}
        >
          Continue <ArrowRight className="size-4" />
        </Button>
      </Container>
    </div>
  );
}
