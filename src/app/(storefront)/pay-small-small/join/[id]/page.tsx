"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  Users,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Lock,
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
  SLOT_DAILY,
  CYCLE_DAYS,
  SLOT_CYCLE_VALUE,
  GROUP_PRICE_CAP,
  isGroupEligible,
  groupSlotsForPrice,
  dailyForSlots,
  isPlanOngoing,
  naira,
} from "@/lib/pay-small-small";

interface Group {
  id: string;
  reference: string;
  name: string;
  totalSlots: number;
  slotsFilled: number;
  cycleLengthDays: number;
  slotsAvailable: number;
}

/** Minimal shape of a plan from /api/me/plans, for the one-group-at-a-time cap. */
interface MyPlan {
  type: "solo" | "group";
  status: string;
  productName: string | null;
}

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

  const [groups, setGroups] = useState<Group[] | null>(null);
  const [myPlans, setMyPlans] = useState<MyPlan[] | null>(null);
  const [step, setStep] = useState<"confirm" | "done">("confirm");
  const [joining, setJoining] = useState(false);

  /* Door delivery vs. store pickup — the fee (delivery only) folds into the plan
     total. Prefilled from the checkout selection when the customer came via checkout. */
  const [delivery, setDelivery] = useState<DeliveryForm>(() => {
    const m = search.get("method");
    if (m === "pickup") return { ...emptyDeliveryForm(), method: "pickup" };
    if (m === "delivery")
      return {
        method: "delivery",
        state: search.get("state") ?? "",
        city: search.get("city") ?? "",
        address: search.get("address") ?? "",
        landmark: search.get("landmark") ?? "",
      };
    return emptyDeliveryForm();
  });
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryError, setDeliveryError] = useState(false);

  useEffect(() => {
    api.get<{ groups: Group[] }>("/api/groups").then((d) => setGroups(d.groups)).catch(() => setGroups([]));
    api.get<{ settings: { deliveryFee: number } }>("/api/settings").then((d) => setDeliveryFee(d.settings.deliveryFee)).catch(() => {});
    api.get<{ plans: MyPlan[] }>("/api/me/plans").then((d) => setMyPlans(d.plans)).catch(() => setMyPlans([]));
  }, []);

  /* One group at a time (§1): an ongoing group plan blocks joining another. A
     running solo plan is fine — solo and group can run together. */
  const ongoingGroup = myPlans?.find((p) => p.type === "group" && isPlanOngoing(p.status)) ?? null;

  /* Target item carried from a product page (productId required to join). */
  const productId = search.get("productId");
  const itemName = search.get("name");
  const itemPrice = Number(search.get("price"));
  const itemImage = search.get("image");
  const hasItem = Boolean(productId) && Boolean(itemName) && itemPrice > 0;

  const group = groups?.find((g) => g.id === id) ?? null;
  const itemSlots = hasItem ? groupSlotsForPrice(itemPrice) : 1;
  const daily = dailyForSlots(itemSlots);
  const fee = delivery.method === "delivery" ? deliveryFee : 0;

  /* ---------------------------- AUTH GATE --------------------------- */
  if (!user) {
    return (
      <AuthRequired
        title="Log in to join a group"
        description="You need an account to join a group and track your Pay Small Small plan. It only takes a minute."
      />
    );
  }

  /* ----------------------------- LOADING ---------------------------- */
  if (groups === null || myPlans === null) {
    return (
      <div className="py-8 sm:py-12">
        <Container className="max-w-2xl">
          <div className="h-8 w-32 rounded bg-muted animate-pulse mb-6" />
          <div className="h-48 rounded-2xl border border-border bg-card animate-pulse" />
        </Container>
      </div>
    );
  }

  /* ----------------- NO TARGET ITEM (need a product) --------------- */
  if (!hasItem) {
    return (
      <div className="py-8 sm:py-12">
        <Container className="max-w-2xl">
          <Link href="/pay-small-small/join" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6 gap-2")}>
            <ArrowLeft className="size-4" /> Back to groups
          </Link>
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
              <Target className="size-7 text-primary" />
            </div>
            <h1 className="text-h2 font-bold mb-2">Choose an item first</h1>
            <p className="text-body-sm text-muted-foreground mb-6 max-w-[44ch] mx-auto">
              A group plan saves toward a specific item (₦{GROUP_PRICE_CAP.toLocaleString("en-NG")} or less). Open the
              product you want and tap <strong>Group Plan</strong> to join toward it.
            </p>
            <Link href="/products" className={cn(buttonVariants(), "gap-2")}>
              Browse products <ArrowRight className="size-4" />
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  /* ----------------- ITEM ABOVE GROUP CAP (ineligible) -------------- */
  if (!isGroupEligible(itemPrice)) {
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
            <Link href={`/pay-small-small/solo?${search.toString()}`} className={cn(buttonVariants(), "gap-2")}>
              Start a solo plan instead <ArrowRight className="size-4" />
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  /* ---------------------------- NOT FOUND / CLOSED ------------------ */
  if (!group) {
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
            <h1 className="text-h2 font-bold mb-2">This group isn&apos;t open</h1>
            <p className="text-body-sm text-muted-foreground mb-6 max-w-[42ch] mx-auto">
              It may be full or no longer available. Join another open group, or start a solo plan with no waiting.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={`/pay-small-small/join?${search.toString()}`} className={cn(buttonVariants(), "gap-2")}>
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

  const slotsLeft = group.slotsAvailable;
  const firstPosition = group.slotsFilled + 1;
  const enoughSlots = slotsLeft >= itemSlots;

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
              You hold {itemSlots} slot{itemSlots !== 1 ? "s" : ""} toward {itemName}. Pay {naira(daily)} daily and
              track your progress on the My Plan page.
            </p>
            <Link href="/pay-small-small/my-plan" className={cn(buttonVariants({ size: "lg" }), "w-full gap-2 justify-center")}>
              Go to My Plan <ArrowRight className="size-4" />
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  /* ------------- ALREADY IN A GROUP (one at a time, §1) ------------- */
  if (ongoingGroup) {
    return <ActivePlanNotice type="group" productName={ongoingGroup.productName} />;
  }

  async function join() {
    if (!group || !productId) return;
    if (!deliveryFormValid(delivery)) {
      setDeliveryError(true);
      toast.error("Add your delivery address, or choose store pickup.");
      return;
    }
    setDeliveryError(false);
    setJoining(true);
    try {
      await api.post(`/api/groups/${group.id}/join`, {
        productId,
        slots: itemSlots,
        deliveryMethod: delivery.method,
        shipping: deliveryShipping(delivery),
      });
      setStep("done");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't join the group. Please try again.");
    } finally {
      setJoining(false);
    }
  }

  /* ---------------------------- CONFIRM ----------------------------- */
  return (
    <div className="py-8 sm:py-12">
      <Container className="max-w-2xl">
        <Link href={`/pay-small-small/join?${search.toString()}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6 gap-2")}>
          <ArrowLeft className="size-4" /> Back to groups
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <Users className="size-5 text-primary" />
          </div>
          <h1 className="text-h1 font-bold">Join {group.reference}</h1>
        </div>
        <p className="text-body-sm text-muted-foreground mb-8">
          You take {itemSlots} slot{itemSlots !== 1 ? "s" : ""} toward this item. Each slot is {naira(SLOT_DAILY)}/day.
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
                    : i < group.slotsFilled + itemSlots
                    ? "bg-accent"
                    : "bg-muted",
                )}
              />
            ))}
          </div>
          <p className="text-caption text-primary font-medium">
            {slotsLeft} slot{slotsLeft !== 1 ? "s" : ""} remaining — you&apos;d take position
            {itemSlots !== 1 ? "s" : ""}{" "}
            {itemSlots === 1 ? firstPosition : `${firstPosition}–${firstPosition + itemSlots - 1}`}
          </p>
        </div>

        {/* Target item */}
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

        {/* How would you like to receive it? */}
        <div className="rounded-2xl border border-border bg-card p-5 mb-5">
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

        {/* Your commitment */}
        <div className="rounded-2xl border border-border bg-muted/50 p-5 mb-5">
          <h2 className="text-body font-semibold mb-3">Your commitment</h2>
          <div className="space-y-2 text-body-sm">
            {[
              ["Slots", `${itemSlots}`],
              ["Daily payment", `${naira(daily)}/day`],
              ["Item price", naira(itemPrice)],
              ["Delivery", fee > 0 ? naira(fee) : "Free (pickup)"],
              ["Total to pay", naira(itemPrice + fee)],
              ["Cycle", `${CYCLE_DAYS} days`],
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
          By joining you agree to pay {naira(daily)}/day (strictly the daily amount — no paying ahead). Missing days
          shows as missed payments on your dashboard. When the plan is fully paid you receive this product and leave the
          group, freeing your slot to join another — money is never withdrawn as cash.
        </p>

        {!enoughSlots && (
          <p className="text-caption text-destructive mb-3">
            This group only has {slotsLeft} slot{slotsLeft !== 1 ? "s" : ""} left — not enough for this item. Try another open group.
          </p>
        )}

        <Button size="lg" className="w-full gap-2" onClick={join} disabled={joining || !enoughSlots}>
          <Users className="size-5" /> {joining ? "Joining…" : `Join ${group.reference}`}
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
