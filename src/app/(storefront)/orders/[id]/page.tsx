"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageCircle, CheckCircle2, Circle, Clock, ShoppingBag } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useUserStore } from "@/store/userStore";
import { AuthRequired } from "@/components/storefront/auth-required";

type OrderStatus =
  | "pending_payment"
  | "payment_submitted"
  | "in_plan"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

interface OrderItem {
  id: string;
  name: string;
  brand?: string | null;
  condition: "new" | "used";
  price: number;
  qty: number;
  image?: string | null;
}

interface Order {
  id: string;
  reference: string;
  createdAt: string;
  status: OrderStatus;
  paymentPlan: "outright" | "solo" | "group";
  subtotal: number;
  deliveryFee: number;
  total: number;
  shipAddress: string;
  shipCity: string;
  shipState: string;
  shipLandmark?: string | null;
  items: OrderItem[];
}

const TIMELINE_STEPS: { key: OrderStatus; label: string }[] = [
  { key: "pending_payment", label: "Pending payment" },
  { key: "payment_submitted", label: "Awaiting confirmation" },
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

const STATUS_ORDER = TIMELINE_STEPS.map((s) => s.key);

const STATUS_META: Record<OrderStatus, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
  pending_payment: { label: "Pending payment", variant: "warning" },
  payment_submitted: { label: "Awaiting confirmation", variant: "warning" },
  in_plan: { label: "Plan active", variant: "default" },
  confirmed: { label: "Confirmed", variant: "success" },
  processing: { label: "Processing", variant: "default" },
  shipped: { label: "Shipped", variant: "default" },
  delivered: { label: "Delivered", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const user = useUserStore((s) => s.user);
  const [order, setOrder] = useState<Order | null>(null);
  const [whatsapp, setWhatsapp] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    api
      .get<{ order: Order }>(`/api/orders/${id}`)
      .then((d) => setOrder(d.order))
      .catch(() => setError("We couldn't find that order."));
    api
      .get<{ settings: { whatsappNumber: string } }>("/api/settings")
      .then((d) => setWhatsapp(d.settings.whatsappNumber))
      .catch(() => {});
  }, [id, user]);

  if (!user) {
    return (
      <AuthRequired
        title="Log in to view this order"
        description="Sign in to see your order details and track its progress."
      />
    );
  }

  if (error) {
    return (
      <div className="py-20">
        <Container>
          <div className="flex flex-col items-center justify-center text-center py-16 max-w-sm mx-auto">
            <div className="flex size-20 items-center justify-center rounded-full bg-muted mb-5">
              <ShoppingBag className="size-9 text-muted-foreground" />
            </div>
            <h1 className="text-h2 font-bold mb-2">Order not found</h1>
            <p className="text-body-sm text-muted-foreground mb-8">{error}</p>
            <Link href="/orders" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
              <ArrowLeft className="size-5" /> My Orders
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-8 sm:py-12">
        <Container>
          <div className="h-8 w-48 rounded bg-muted animate-pulse mb-8" />
          <div className="h-40 rounded-2xl border border-border bg-card animate-pulse" />
        </Container>
      </div>
    );
  }

  const statusIdx = STATUS_ORDER.indexOf(order.status);
  const isCancelled = order.status === "cancelled";
  const isPlan = order.paymentPlan !== "outright";
  const isPendingPayment = order.status === "pending_payment";
  const waNumber = whatsapp || "2340000000000";

  return (
    <div className="py-8 sm:py-12">
      <Container>
        <Link href="/orders" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6 gap-2")}>
          <ArrowLeft className="size-4" /> My Orders
        </Link>

        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="text-h2 font-bold font-mono">{order.reference}</h1>
            <p className="text-caption text-muted-foreground mt-1">
              Placed {new Date(order.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <Badge variant={STATUS_META[order.status].variant} className="text-body-sm px-3 py-1">
            {STATUS_META[order.status].label}
          </Badge>
        </div>

        {/* Plan orders track their schedule on My Plan, not the order timeline. */}
        {isPlan ? (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-body-sm font-semibold capitalize">{order.paymentPlan} plan in progress</p>
              <p className="text-caption text-muted-foreground mt-0.5">
                Track your payments, progress and delivery point on the My Plan page.
              </p>
            </div>
            <Link href="/pay-small-small/my-plan" className={cn(buttonVariants(), "flex-shrink-0")}>
              Go to My Plan
            </Link>
          </div>
        ) : (
          !isCancelled && (
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 mb-6">
              <h2 className="text-body font-semibold mb-5">Order progress</h2>

              {/* Vertical timeline — mobile */}
              <ol className="sm:hidden">
                {TIMELINE_STEPS.map((step, i) => {
                  const done = STATUS_ORDER.indexOf(step.key) <= statusIdx;
                  const current = step.key === order.status;
                  const last = i === TIMELINE_STEPS.length - 1;
                  const nextDone = !last && STATUS_ORDER.indexOf(TIMELINE_STEPS[i + 1].key) <= statusIdx;
                  return (
                    <li key={step.key} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "flex size-8 items-center justify-center rounded-full border-2 transition-colors",
                            done
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-muted-foreground",
                          )}
                        >
                          {done ? (
                            current ? <Clock className="size-4" /> : <CheckCircle2 className="size-4" />
                          ) : (
                            <Circle className="size-4" />
                          )}
                        </div>
                        {!last && (
                          <div
                            className={cn(
                              "w-0.5 flex-1 min-h-[1.25rem] my-1 transition-colors",
                              nextDone ? "bg-primary" : "bg-border",
                            )}
                          />
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-body-sm font-medium leading-tight pt-1.5",
                          last ? "pb-0" : "pb-4",
                          done ? "text-primary" : "text-muted-foreground",
                        )}
                      >
                        {step.label}
                      </span>
                    </li>
                  );
                })}
              </ol>

              {/* Horizontal timeline — sm and up */}
              <div className="hidden sm:flex items-start gap-0">
                {TIMELINE_STEPS.map((step, i) => {
                  const done = STATUS_ORDER.indexOf(step.key) <= statusIdx;
                  const current = step.key === order.status;
                  return (
                    <div
                      key={step.key}
                      className={cn(
                        "flex items-start",
                        i < TIMELINE_STEPS.length - 1 ? "flex-1" : "flex-shrink-0",
                      )}
                    >
                      <div className="flex flex-col items-center gap-1.5">
                        <div
                          className={cn(
                            "flex size-8 items-center justify-center rounded-full border-2 transition-colors",
                            done
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-muted-foreground",
                          )}
                        >
                          {done ? (
                            current ? <Clock className="size-4" /> : <CheckCircle2 className="size-4" />
                          ) : (
                            <Circle className="size-4" />
                          )}
                        </div>
                        <span
                          className={cn(
                            "text-micro font-medium max-w-[70px] text-center leading-tight",
                            done ? "text-primary" : "text-muted-foreground",
                          )}
                        >
                          {step.label}
                        </span>
                      </div>
                      {i < TIMELINE_STEPS.length - 1 && (
                        <div
                          className={cn(
                            "h-0.5 flex-1 min-w-[3rem] mx-1 mt-4 transition-colors",
                            STATUS_ORDER.indexOf(TIMELINE_STEPS[i + 1].key) <= statusIdx
                              ? "bg-primary"
                              : "bg-border",
                          )}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
          {/* Items */}
          <div className="sm:col-span-2 rounded-2xl border border-border bg-card p-5">
            <h2 className="text-body font-semibold mb-4">Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="size-14 rounded-lg overflow-hidden border border-border bg-muted flex-shrink-0">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <ShoppingBag className="size-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-semibold line-clamp-1">{item.name}</p>
                    <p className="text-caption text-muted-foreground">
                      {item.brand ? `${item.brand} · ` : ""}{item.condition === "new" ? "New" : "Pre-owned"} · Qty {item.qty}
                    </p>
                  </div>
                  <p className="text-body-sm font-bold flex-shrink-0">
                    ₦{(item.price * item.qty).toLocaleString("en-NG")}
                  </p>
                </div>
              ))}
            </div>
            <hr className="border-border my-4" />
            <div className="space-y-1.5 text-body-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>₦{order.subtotal.toLocaleString("en-NG")}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery</span>
                <span>₦{order.deliveryFee.toLocaleString("en-NG")}</span>
              </div>
              <div className="flex justify-between font-bold text-body">
                <span>Total</span>
                <span className="text-primary">₦{order.total.toLocaleString("en-NG")}</span>
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-body font-semibold mb-3">Delivery address</h2>
            <div className="space-y-0.5 text-body-sm text-muted-foreground">
              <p className="font-semibold text-foreground">{user.name}</p>
              <p>{order.shipAddress}</p>
              <p>{order.shipCity}, {order.shipState}</p>
              {order.shipLandmark && <p className="text-caption">Near: {order.shipLandmark}</p>}
            </div>
          </div>

          {/* Support */}
          <div className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between gap-4">
            <div>
              <h2 className="text-body font-semibold mb-1">Need help?</h2>
              <p className="text-body-sm text-muted-foreground">
                Questions about this order? Chat with us directly on WhatsApp.
              </p>
            </div>
            <a
              href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi, I have a question about order ${order.reference}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-body-sm font-medium text-white hover:bg-[#1eb85a] transition-colors w-fit"
            >
              <MessageCircle className="size-4" /> Chat on WhatsApp
            </a>
          </div>
        </div>

        {/* Actions */}
        {isPendingPayment && (
          <div className="rounded-2xl border border-warning/30 bg-warning/5 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-body-sm font-semibold">Payment not yet sent</p>
              <p className="text-caption text-muted-foreground mt-0.5">
                Complete your bank transfer and send the screenshot on WhatsApp to confirm your order.
              </p>
            </div>
            <Link
              href={`/orders/${order.id}/payment`}
              className={cn(buttonVariants(), "flex-shrink-0 gap-2")}
            >
              Complete payment
            </Link>
          </div>
        )}
      </Container>
    </div>
  );
}
