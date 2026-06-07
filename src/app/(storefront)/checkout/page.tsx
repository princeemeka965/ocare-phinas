"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  Truck,
  Store,
  Landmark,
  ShieldCheck,
  Lock,
  Wallet,
  User,
  Users,
  CalendarClock,
} from "lucide-react";

import { Container } from "@/components/layout/container";
import {
  Button,
  buttonVariants,
  FormField,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import { useCartStore, cartItemCount, cartSubtotal } from "@/store/cartStore";
import { useUserStore } from "@/store/userStore";
import { toast } from "@/store/toastStore";
import { AuthRequired } from "@/components/storefront/auth-required";
import {
  soloPlanMath,
  dailyForSlots,
  groupSlotsForPrice,
  isGroupEligible,
  GROUP_PRICE_CAP,
  suggestedSoloAmount,
  SOLO_FREQUENCIES,
  type SoloFrequency,
  naira,
} from "@/lib/pay-small-small";

const FREQUENCY_ORDER: SoloFrequency[] = ["daily", "weekly", "monthly"];

/* Nigerian states — delivery fees are mocked here; in Phase 3 they come from Settings (B10). */
const NG_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

const FREE_DELIVERY_THRESHOLD = 200_000;

/** Mocked delivery fee by state — replace with Settings-driven rates in Phase 3. */
function deliveryFeeFor(state: string, subtotal: number) {
  if (!state) return null;
  if (subtotal >= FREE_DELIVERY_THRESHOLD) return 0;
  if (state === "Lagos") return 2_500;
  if (state === "FCT - Abuja") return 3_500;
  return 5_000;
}

type PayPlan = "outright" | "solo" | "group";

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const user = useUserStore((s) => s.user);

  const [plan, setPlan] = useState<PayPlan>("outright");
  const [soloFreq, setSoloFreq] = useState<SoloFrequency>("daily");
  const [soloAmount, setSoloAmount] = useState("");
  const [method, setMethod] = useState<"delivery" | "pickup">("delivery");
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  /* Must be logged in to check out. */
  if (!user) {
    return (
      <AuthRequired
        title="Log in to check out"
        description="You need an account to place an order and track its payment. Your cart will be waiting for you."
      />
    );
  }

  const count = cartItemCount(items);
  const subtotal = cartSubtotal(items);

  /* Bounce empty carts back to the catalog. */
  if (count === 0) {
    return (
      <div className="py-20">
        <Container>
          <div className="flex flex-col items-center justify-center text-center py-16 max-w-md mx-auto">
            <div className="flex size-20 items-center justify-center rounded-full bg-muted mb-5">
              <ShoppingBag className="size-9 text-muted-foreground" aria-hidden />
            </div>
            <h1 className="text-h2 font-bold mb-2">Nothing to check out</h1>
            <p className="text-body-sm text-muted-foreground mb-8">
              Your cart is empty. Add a few items and they&apos;ll show up here ready for checkout.
            </p>
            <Link href="/products" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
              <ShoppingBag className="size-5" /> Start shopping
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const isDelivery = method === "delivery";
  const deliveryFee = isDelivery ? deliveryFeeFor(state, subtotal) : 0;
  const total = subtotal + (deliveryFee ?? 0);

  /* ----------------------- Plan derivations ----------------------- */
  /* Solo — the customer chooses how much AND how often (daily/weekly/monthly). */
  const soloMeta = SOLO_FREQUENCIES[soloFreq];
  const soloAmountNum = Number(soloAmount);
  const soloValid = soloAmountNum >= soloMeta.min && soloAmountNum <= subtotal;
  const soloMath =
    plan === "solo" && soloAmountNum > 0 ? soloPlanMath(subtotal, soloAmountNum, soloFreq) : null;

  /* Group — shared slot pool; only for carts worth ₦100,000 or less. */
  const groupEligible = isGroupEligible(subtotal);
  const groupSlots = groupSlotsForPrice(subtotal);
  const groupDaily = dailyForSlots(groupSlots);

  /* Pick a payment plan, seeding the solo amount with a suggestion. */
  function choosePlan(next: PayPlan) {
    setPlan(next);
    if (next === "solo" && !soloAmount) setSoloAmount(String(suggestedSoloAmount(subtotal, soloFreq)));
  }

  /* Switching frequency re-seeds the amount with that period's suggestion. */
  function chooseSoloFreq(next: SoloFrequency) {
    setSoloFreq(next);
    setSoloAmount(String(suggestedSoloAmount(subtotal, next)));
  }

  const submitDisabled =
    loading ||
    (plan === "solo" && !soloValid) ||
    (plan === "group" && !groupEligible);

  const ctaText =
    plan === "outright" ? "Place order" : plan === "solo" ? "Start solo plan" : "Start group plan";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const next: Record<string, string> = {};

    const fullName = (fd.get("fullName") as string)?.trim();
    const email = (fd.get("email") as string)?.trim();
    const phone = (fd.get("phone") as string)?.trim();

    if (!fullName) next.fullName = "Enter the recipient's full name.";
    if (!email?.includes("@")) next.email = "Enter a valid email address.";
    if (!/^(\+234|0)[789]\d{9}$/.test((phone ?? "").replace(/\s/g, "")))
      next.phone = "Enter a valid Nigerian phone number (e.g. 08012345678).";

    if (isDelivery) {
      if (!state) next.state = "Select your state.";
      if (!(fd.get("city") as string)?.trim()) next.city = "Enter your city or town.";
      if (!(fd.get("address") as string)?.trim())
        next.address = "Enter your street address.";
    }

    if (plan === "solo" && !soloValid)
      next.soloAmount = `Enter an amount between ${naira(soloMeta.min)} and ${naira(subtotal)}.`;
    if (plan === "group" && !groupEligible)
      next.plan = `Group plans are only for carts of ${naira(GROUP_PRICE_CAP)} or less.`;

    if (Object.keys(next).length > 0) {
      setErrors(next);
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setErrors({});
    setLoading(true);

    /* Re-validate the cart against live stock + price before committing. */
    try {
      const v = await api.post<{ hasIssues: boolean }>("/api/cart/validate", {
        items: items.map((i) => ({ id: i.id, qty: i.quantity, price: i.price })),
      });
      if (v.hasIssues) {
        toast.error("Some items changed in price or availability — please review your cart.");
        setLoading(false);
        router.push("/cart");
        return;
      }
    } catch {
      toast.error("Couldn't verify your cart. Please try again.");
      setLoading(false);
      return;
    }

    /* Shipping — pickup uses the store address so the order always has a location. */
    const shipping = isDelivery
      ? {
          address: (fd.get("address") as string).trim(),
          city: (fd.get("city") as string).trim(),
          state,
          landmark: ((fd.get("landmark") as string) || "").trim() || undefined,
        }
      : { address: "Pickup — OCare Phinas Store, 1 Otigba Street", city: "Ikeja", state: "Lagos" };

    try {
      /* Outright — create a pending order; stock is decremented only when an admin
         confirms the bank transfer. */
      if (plan === "outright") {
        const { order } = await api.post<{ order: { id: string } }>("/api/orders", {
          items: items.map((i) => ({ id: i.id, qty: i.quantity })),
          shipping,
        });
        clearCart();
        toast.success("Order created — complete your bank transfer to confirm it.");
        router.push(`/orders/${order.id}/payment`);
        return;
      }

      /* Pay Small Small plans cover a single item (slot math is per-product). */
      if (items.length !== 1 || items[0].quantity !== 1) {
        toast.error("Pay Small Small plans cover one item at a time. Keep a single item in your cart to start a plan.");
        setLoading(false);
        return;
      }
      const line = items[0];

      if (plan === "solo") {
        await api.post("/api/plans", {
          productId: line.id,
          perPayment: soloAmountNum,
          frequency: soloFreq,
          shipping,
        });
        clearCart();
        toast.success("Solo plan started — track your payments on My Plan.");
        router.push("/pay-small-small/my-plan");
        return;
      }

      /* Group — pick an open group on the join page, carrying the chosen item. */
      const qs = new URLSearchParams({
        productId: line.id,
        name: line.name,
        price: String(line.price),
        image: line.image ?? "",
      });
      router.push(`/pay-small-small/join?${qs.toString()}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="py-8 sm:py-12">
      <Container>
        <Link
          href="/cart"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6 gap-2")}
        >
          <ArrowLeft className="size-4" /> Back to cart
        </Link>

        <h1 className="text-h1 font-bold mb-8">Checkout</h1>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col lg:flex-row gap-8">
          {/* Left — details */}
          <div className="flex-1 space-y-6">
            {/* How would you like to pay? */}
            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <div>
                <h2 className="text-h3 font-bold">How would you like to pay?</h2>
                <p className="text-caption text-muted-foreground mt-0.5">
                  Pay the full amount now, or spread it over time with Pay Small Small.
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <MethodTile
                  active={plan === "outright"}
                  icon={<Wallet className="size-5" />}
                  title="Pay outright"
                  desc="Pay the full amount now by bank transfer."
                  onClick={() => choosePlan("outright")}
                />
                <MethodTile
                  active={plan === "solo"}
                  icon={<User className="size-5" />}
                  title="Solo plan"
                  desc="Save daily at your own pace. Delivered at 50%."
                  onClick={() => choosePlan("solo")}
                />
                <MethodTile
                  active={plan === "group"}
                  icon={<Users className="size-5" />}
                  title="Group plan"
                  desc={
                    groupEligible
                      ? "Share a slot pool. Delivered in turn."
                      : `Carts over ${naira(GROUP_PRICE_CAP)} aren't eligible.`
                  }
                  disabled={!groupEligible}
                  onClick={() => choosePlan("group")}
                />
              </div>
              {errors.plan && <p className="text-caption text-destructive">{errors.plan}</p>}
            </section>

            {/* Plan setup — shown right after the chooser, above delivery, for Pay Small Small */}
            {plan === "solo" && (
              <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <h2 className="text-h3 font-bold">Your solo plan</h2>
                <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-4">
                  {/* When — frequency */}
                  <p className="text-caption font-semibold uppercase tracking-wide text-muted-foreground">
                    How often will you pay?
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {FREQUENCY_ORDER.map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => chooseSoloFreq(f)}
                        aria-pressed={soloFreq === f}
                        className={cn(
                          "rounded-xl border px-3 py-2 text-body-sm font-semibold transition-colors",
                          soloFreq === f
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground hover:border-primary/40",
                        )}
                      >
                        {SOLO_FREQUENCIES[f].label}
                      </button>
                    ))}
                  </div>

                  {/* How much — amount per payment */}
                  <div className="mt-4">
                    <FormField
                      label={`How much per ${soloMeta.unit}?`}
                      htmlFor="soloAmount"
                      error={errors.soloAmount}
                      hint={`Per ${soloMeta.unit} — minimum ${naira(soloMeta.min)}. You decide the pace.`}
                    >
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-body font-bold text-primary">₦</span>
                        <Input
                          id="soloAmount"
                          name="soloAmount"
                          type="number"
                          inputMode="numeric"
                          min={soloMeta.min}
                          max={subtotal}
                          step={100}
                          value={soloAmount}
                          onChange={(e) => setSoloAmount(e.target.value)}
                          placeholder={String(suggestedSoloAmount(subtotal, soloFreq))}
                          className="pl-8 pr-16 font-bold"
                          aria-invalid={!!errors.soloAmount}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-caption font-medium text-muted-foreground">
                          {soloMeta.per}
                        </span>
                      </div>
                    </FormField>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {[1, 2, 5, 10].map((mult) => {
                      const amt = 1000 * soloMeta.days * mult;
                      return (
                        <button
                          key={mult}
                          type="button"
                          onClick={() => setSoloAmount(String(amt))}
                          className={cn(
                            "rounded-full border px-3 py-1 text-caption font-semibold transition-colors",
                            soloAmountNum === amt
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-muted-foreground hover:border-primary/40",
                          )}
                        >
                          {naira(amt)}
                          {soloMeta.per}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {soloMath && soloValid && (
                  <div className="flex items-start gap-2 rounded-xl bg-muted/50 border border-border p-3 text-caption">
                    <Truck className="size-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      Pay {naira(soloMath.amount)} a {soloMeta.unit}. We deliver once you&apos;ve paid{" "}
                      <span className="font-semibold text-foreground">{naira(soloMath.deliveryTarget)}</span> (50%) —
                      about <span className="font-semibold text-foreground">{soloMath.paymentsToDelivery} {soloMeta.unit}{soloMath.paymentsToDelivery !== 1 ? "s" : ""}</span> in —
                      then you finish the balance over {soloMath.paymentsToComplete} {soloMeta.unit}{soloMath.paymentsToComplete !== 1 ? "s" : ""} total.
                    </span>
                  </div>
                )}
                <p className="text-caption text-muted-foreground">
                  By starting a plan you agree to the{" "}
                  <Link href="/pay-small-small/solo-terms" className="text-primary underline underline-offset-2">
                    Solo Plan Terms &amp; Conditions
                  </Link>
                  .
                </p>
              </section>
            )}

            {plan === "group" && (
              <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <h2 className="text-h3 font-bold">Your group plan</h2>
                <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                    <Users className="size-5" />
                  </div>
                  <div>
                    <p className="text-body-sm font-semibold">
                      {groupSlots} slot{groupSlots !== 1 ? "s" : ""} · {naira(groupDaily)}/day
                    </p>
                    <p className="text-caption text-muted-foreground mt-0.5">
                      You join a shared slot pool at ₦1,000 per slot a day. Members are delivered in
                      position order as the group&apos;s funds build. Group plans are for carts of{" "}
                      {naira(GROUP_PRICE_CAP)} or less.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-xl bg-muted/50 border border-border p-3 text-caption">
                  <CalendarClock className="size-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">
                    We&apos;ll place you in the next open group and confirm your position on My Plan.
                  </span>
                </div>
                <p className="text-caption text-muted-foreground">
                  By starting a plan you agree to the{" "}
                  <Link href="/pay-small-small/group-terms" className="text-primary underline underline-offset-2">
                    Group Savings Plan Terms &amp; Conditions
                  </Link>
                  .
                </p>
              </section>
            )}

            {/* Contact */}
            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <div>
                <h2 className="text-h3 font-bold">Contact details</h2>
                <p className="text-caption text-muted-foreground mt-0.5">
                  We&apos;ll send your order updates and payment confirmation here.
                </p>
              </div>

              <FormField label="Full name" htmlFor="fullName" required error={errors.fullName}>
                <Input
                  id="fullName"
                  name="fullName"
                  autoComplete="name"
                  defaultValue={user?.name ?? ""}
                  placeholder="Chukwuemeka Anyanwu"
                  aria-invalid={!!errors.fullName}
                />
              </FormField>

              <div className="grid sm:grid-cols-2 gap-4">
                <FormField label="Email address" htmlFor="email" required error={errors.email}>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    defaultValue={user?.email ?? ""}
                    placeholder="you@example.com"
                    aria-invalid={!!errors.email}
                  />
                </FormField>
                <FormField label="Phone number" htmlFor="phone" required error={errors.phone}>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="08012345678"
                    aria-invalid={!!errors.phone}
                  />
                </FormField>
              </div>
            </section>

            {/* Delivery method */}
            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-h3 font-bold">Delivery method</h2>
              {plan !== "outright" && (
                <p className="text-caption text-muted-foreground -mt-2">
                  Tell us where to deliver — we ship once your plan reaches its delivery point.
                </p>
              )}

              <div className="grid sm:grid-cols-2 gap-3">
                <MethodTile
                  active={isDelivery}
                  icon={<Truck className="size-5" />}
                  title="Door delivery"
                  desc="Delivered to your address nationwide."
                  onClick={() => setMethod("delivery")}
                />
                <MethodTile
                  active={!isDelivery}
                  icon={<Store className="size-5" />}
                  title="Pickup at store"
                  desc="Collect from our Lagos store — free."
                  onClick={() => setMethod("pickup")}
                />
              </div>

              {isDelivery ? (
                <div className="space-y-4 pt-2">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField label="State" htmlFor="state" required error={errors.state}>
                      <Select
                        id="state"
                        name="state"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        aria-invalid={!!errors.state}
                      >
                        <option value="" disabled>
                          Select state
                        </option>
                        {NG_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                    <FormField label="City / Town" htmlFor="city" required error={errors.city}>
                      <Input
                        id="city"
                        name="city"
                        autoComplete="address-level2"
                        placeholder="e.g. Ikeja"
                        aria-invalid={!!errors.city}
                      />
                    </FormField>
                  </div>

                  <FormField
                    label="Street address"
                    htmlFor="address"
                    required
                    error={errors.address}
                  >
                    <Input
                      id="address"
                      name="address"
                      autoComplete="street-address"
                      placeholder="House number, street name, area"
                      aria-invalid={!!errors.address}
                    />
                  </FormField>

                  <FormField
                    label="Landmark / delivery notes"
                    htmlFor="landmark"
                    hint="Optional — anything that helps the rider find you."
                  >
                    <Input id="landmark" name="landmark" placeholder="Near the blue gate, opposite…" />
                  </FormField>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-muted/50 p-4 text-body-sm">
                  <p className="font-medium">OCare Phinas Store, Computer Village</p>
                  <p className="text-muted-foreground mt-0.5">
                    1 Otigba Street, Ikeja, Lagos. Open Mon–Sat, 9am–6pm. We&apos;ll text you when
                    your order is ready to collect.
                  </p>
                </div>
              )}
            </section>

            {/* Payment method (outright) + order note */}
            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-h3 font-bold">
                {plan === "outright" ? "Payment method" : "Anything else?"}
              </h2>

              {plan === "outright" && (
                <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                    <Landmark className="size-5" />
                  </div>
                  <div>
                    <p className="text-body-sm font-semibold">Bank transfer</p>
                    <p className="text-caption text-muted-foreground mt-0.5">
                      After you place your order we&apos;ll show our account details. Transfer the
                      exact total, send your screenshot on WhatsApp, and we confirm it manually —
                      usually within 2 hours on business days.
                    </p>
                  </div>
                </div>
              )}

              <FormField
                label="Order note"
                htmlFor="note"
                hint="Optional — anything we should know about this order."
              >
                <Textarea id="note" name="note" rows={3} placeholder="e.g. Please call before delivery." />
              </FormField>
            </section>
          </div>

          {/* Right — summary */}
          <div className="lg:w-80 xl:w-96 flex-shrink-0">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-5 sticky top-24">
              <h2 className="text-h3 font-bold">Order summary</h2>

              {/* Line items */}
              <ul className="space-y-3 max-h-64 overflow-y-auto scrollbar-none">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-3">
                    <div className="relative flex-shrink-0 size-14 rounded-lg overflow-hidden border border-border bg-muted">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <ShoppingBag className="size-5 text-muted-foreground" />
                        </div>
                      )}
                      <span className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-caption font-medium line-clamp-2">{item.name}</p>
                      <p className="text-caption text-muted-foreground mt-0.5">
                        ₦{(item.price * item.quantity).toLocaleString("en-NG")}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <hr className="border-border" />

              {plan === "outright" ? (
                <div className="space-y-2 text-body-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal ({count} items)</span>
                    <span className="font-medium">₦{subtotal.toLocaleString("en-NG")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery fee</span>
                    <span className={cn("font-medium", deliveryFee === 0 && "text-primary")}>
                      {!isDelivery
                        ? "Free (pickup)"
                        : deliveryFee == null
                          ? "Select state"
                          : deliveryFee === 0
                            ? "Free"
                            : `₦${deliveryFee.toLocaleString("en-NG")}`}
                    </span>
                  </div>
                  {isDelivery && subtotal < FREE_DELIVERY_THRESHOLD && (
                    <p className="text-caption text-muted-foreground">
                      Free delivery on orders over ₦{FREE_DELIVERY_THRESHOLD.toLocaleString("en-NG")}.
                    </p>
                  )}
                  <hr className="border-border" />
                  <div className="flex justify-between text-body font-bold">
                    <span>Total</span>
                    <span className="text-primary">₦{total.toLocaleString("en-NG")}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-body-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan value ({count} items)</span>
                    <span className="font-medium">₦{subtotal.toLocaleString("en-NG")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan type</span>
                    <span className="font-medium capitalize">{plan}</span>
                  </div>
                  <hr className="border-border" />
                  <div className="flex justify-between text-body font-bold">
                    <span>Pay today</span>
                    <span className="text-primary">
                      {plan === "solo"
                        ? soloValid
                          ? `${naira(soloMath!.amount)}${soloMeta.per}`
                          : "Set amount"
                        : `${naira(groupDaily)}/day`}
                    </span>
                  </div>
                  <p className="text-caption text-muted-foreground">
                    No payment is taken now — your first payment starts your plan. Money paid in
                    can only ever become a product; there are no withdrawals.
                  </p>
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full gap-2 justify-center"
                disabled={submitDisabled}
              >
                {loading ? (
                  plan === "outright" ? "Placing order…" : "Starting plan…"
                ) : (
                  <>
                    {ctaText} <ArrowRight className="size-4" />
                  </>
                )}
              </Button>

              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 text-caption text-muted-foreground">
                  <ShieldCheck className="size-3.5 flex-shrink-0 text-primary" />
                  {plan === "outright"
                    ? "Stock is reserved once we confirm your payment."
                    : "We deliver once your plan reaches its delivery point."}
                </div>
                <div className="flex items-center gap-2 text-caption text-muted-foreground">
                  <Lock className="size-3.5 flex-shrink-0 text-primary" />
                  Your details are kept private and secure.
                </div>
              </div>
            </div>
          </div>
        </form>
      </Container>
    </div>
  );
}

function MethodTile({
  active,
  icon,
  title,
  desc,
  onClick,
  disabled,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
        active
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border hover:border-primary/40 hover:bg-muted/50",
        disabled && "opacity-50 cursor-not-allowed hover:border-border hover:bg-transparent",
      )}
    >
      <div
        className={cn(
          "flex size-10 items-center justify-center rounded-lg flex-shrink-0",
          active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
        )}
      >
        {icon}
      </div>
      <div>
        <p className="text-body-sm font-semibold">{title}</p>
        <p className="text-caption text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </button>
  );
}
