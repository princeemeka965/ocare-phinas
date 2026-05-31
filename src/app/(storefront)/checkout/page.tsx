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
import { useCartStore, cartItemCount, cartSubtotal } from "@/store/cartStore";
import { useUserStore } from "@/store/userStore";
import { toast } from "@/store/toastStore";
import { AuthRequired } from "@/components/storefront/auth-required";

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

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const user = useUserStore((s) => s.user);

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

    if (Object.keys(next).length > 0) {
      setErrors(next);
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setErrors({});
    setLoading(true);

    /* Phase 3: POST /api/orders → returns reference + id. Stock is decremented only
       after an admin confirms the bank transfer, so we just create a pending order. */
    await new Promise((r) => setTimeout(r, 900));
    const reference = `OCP-2026-${String(Math.floor(Math.random() * 90000) + 10000)}`;

    clearCart();
    toast.success("Order created — complete your bank transfer to confirm it.");
    router.push(`/orders/${reference}/payment`);
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

            {/* Payment method */}
            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-h3 font-bold">Payment method</h2>

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

              <Button type="submit" size="lg" className="w-full gap-2 justify-center" disabled={loading}>
                {loading ? (
                  "Placing order…"
                ) : (
                  <>
                    Place order <ArrowRight className="size-4" />
                  </>
                )}
              </Button>

              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 text-caption text-muted-foreground">
                  <ShieldCheck className="size-3.5 flex-shrink-0 text-primary" />
                  Stock is reserved once we confirm your payment.
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
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
        active
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border hover:border-primary/40 hover:bg-muted/50",
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
