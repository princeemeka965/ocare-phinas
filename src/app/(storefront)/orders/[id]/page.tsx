import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MessageCircle, CheckCircle2, Circle, Clock } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Order Detail — OCare Phinas" };

type OrderStatus = "pending_payment" | "payment_submitted" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

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
  confirmed: { label: "Confirmed", variant: "success" },
  processing: { label: "Processing", variant: "default" },
  shipped: { label: "Shipped", variant: "default" },
  delivered: { label: "Delivered", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

/* Mock data — replace with authenticated DB fetch in Phase 3 */
const MOCK_ORDER = {
  id: "1",
  reference: "OCP-2026-00042",
  date: "2026-05-25",
  status: "confirmed" as OrderStatus,
  items: [
    { id: "1", name: "Samsung Galaxy S24 Ultra 256GB", brand: "Samsung", condition: "new" as const, price: 65990, qty: 1, image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=200&h=200&fit=crop&q=80" },
  ],
  subtotal: 65990,
  deliveryFee: 2500,
  total: 68490,
  shipping: {
    name: "Chukwuemeka Anyanwu",
    phone: "08012345678",
    address: "14 Marina Close, Victoria Island",
    city: "Lagos",
    state: "Lagos State",
    landmark: "Near First Bank",
  },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const order = MOCK_ORDER; // Phase 3: fetch by id

  const statusIdx = STATUS_ORDER.indexOf(order.status);
  const isCancelled = order.status === "cancelled";
  const isPendingPayment = order.status === "pending_payment";

  return (
    <div className="py-8 sm:py-12">
      <Container className="max-w-3xl">
        <Link href="/orders" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6 gap-2")}>
          <ArrowLeft className="size-4" /> My Orders
        </Link>

        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="text-h2 font-bold font-mono">{order.reference}</h1>
            <p className="text-caption text-muted-foreground mt-1">
              Placed {new Date(order.date).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <Badge variant={STATUS_META[order.status].variant} className="text-body-sm px-3 py-1">
            {STATUS_META[order.status].label}
          </Badge>
        </div>

        {/* Status timeline */}
        {!isCancelled && (
          <div className="rounded-2xl border border-border bg-card p-6 mb-6">
            <h2 className="text-body font-semibold mb-5">Order progress</h2>
            <div className="flex items-center gap-0 overflow-x-auto scrollbar-none pb-2">
              {TIMELINE_STEPS.map((step, i) => {
                const done = STATUS_ORDER.indexOf(step.key) <= statusIdx;
                const current = step.key === order.status;
                return (
                  <div key={step.key} className="flex items-center flex-shrink-0">
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
                          "text-micro font-medium whitespace-nowrap max-w-[70px] text-center leading-tight",
                          done ? "text-primary" : "text-muted-foreground",
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                    {i < TIMELINE_STEPS.length - 1 && (
                      <div
                        className={cn(
                          "h-0.5 w-8 sm:w-12 mx-1 flex-shrink-0 transition-colors",
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
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
          {/* Items */}
          <div className="sm:col-span-2 rounded-2xl border border-border bg-card p-5">
            <h2 className="text-body font-semibold mb-4">Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="size-14 rounded-lg overflow-hidden border border-border bg-muted flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-semibold line-clamp-1">{item.name}</p>
                    <p className="text-caption text-muted-foreground">
                      {item.brand} · {item.condition === "new" ? "New" : "Pre-owned"} · Qty {item.qty}
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
              <p className="font-semibold text-foreground">{order.shipping.name}</p>
              <p>{order.shipping.phone}</p>
              <p>{order.shipping.address}</p>
              <p>{order.shipping.city}, {order.shipping.state}</p>
              {order.shipping.landmark && <p className="text-caption">Near: {order.shipping.landmark}</p>}
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
              href={`https://wa.me/2340000000000?text=Hi, I have a question about order ${order.reference}`}
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
