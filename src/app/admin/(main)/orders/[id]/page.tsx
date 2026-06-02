import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getOrder, PLAN_META } from "@/lib/orders";
import { waLink } from "@/lib/whatsapp";
import { StatusManager } from "./status-manager";

export const metadata: Metadata = { title: "Order Detail — OCare Phinas Admin" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const order = getOrder(id);
  if (!order) notFound();

  const plan = PLAN_META[order.paymentPlan];
  const PlanIcon = plan.icon;
  const isPlan = order.paymentPlan !== "outright";

  return (
    <div className="space-y-6 max-w-5xl">
      <Link href="/admin/orders" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2 -ml-2")}>
        <ArrowLeft className="size-4" /> All orders
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-h2 font-bold font-mono">{order.reference}</h1>
            <Badge variant={plan.variant} className="text-micro gap-1"><PlanIcon className="size-3" />{plan.label}</Badge>
          </div>
          <p className="text-caption text-muted-foreground mt-1">
            Placed {new Date(order.date).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <p className="text-h2 font-bold text-primary">₦{order.total.toLocaleString("en-NG")}</p>
      </div>

      {/* Status management */}
      <StatusManager reference={order.reference} initialStatus={order.status} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items + totals */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
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
                <p className="text-body-sm font-bold flex-shrink-0">₦{(item.price * item.qty).toLocaleString("en-NG")}</p>
              </div>
            ))}
          </div>
          <hr className="border-border my-4" />
          <div className="space-y-1.5 text-body-sm">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>₦{order.subtotal.toLocaleString("en-NG")}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Delivery</span><span>₦{order.deliveryFee.toLocaleString("en-NG")}</span></div>
            <div className="flex justify-between font-bold text-body"><span>Total</span><span className="text-primary">₦{order.total.toLocaleString("en-NG")}</span></div>
          </div>
        </div>

        {/* Customer + payment + shipping */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-body font-semibold mb-3">Customer</h2>
            <div className="space-y-2 text-body-sm">
              <p className="font-semibold">{order.customer.name}</p>
              <p className="flex items-center gap-2 text-muted-foreground"><Mail className="size-3.5 flex-shrink-0" /> {order.customer.email}</p>
              <p className="flex items-center gap-2 text-muted-foreground"><Phone className="size-3.5 flex-shrink-0" /> {order.customer.phone}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-body font-semibold mb-3">Delivery address</h2>
            <div className="flex items-start gap-2 text-body-sm text-muted-foreground">
              <MapPin className="size-3.5 mt-0.5 flex-shrink-0" />
              <div>
                <p>{order.shipping.address}</p>
                <p>{order.shipping.city}, {order.shipping.state}</p>
                {order.shipping.landmark && <p className="text-caption">Near: {order.shipping.landmark}</p>}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-body font-semibold mb-3">Payment</h2>
            <div className="space-y-2.5 text-body-sm">
              <div className="flex justify-between gap-3"><span className="text-muted-foreground">Paid via</span><span className="font-medium flex items-center gap-1.5"><PlanIcon className="size-3.5" />{plan.label}</span></div>
              <div className="flex justify-between gap-3"><span className="text-muted-foreground">Method</span><span className="font-medium">Bank transfer (manual)</span></div>
              <div className="flex justify-between gap-3"><span className="text-muted-foreground">Amount</span><span className="font-bold text-primary">₦{order.total.toLocaleString("en-NG")}</span></div>
            </div>
            <p className="text-caption text-muted-foreground mt-3">
              {isPlan
                ? `Fulfilled from the customer's ${plan.label.toLowerCase()} — daily contributions are paid manually and confirmed in the Contributions queue, not here.`
                : "The customer transfers manually and sends the screenshot on WhatsApp. Verify it against your bank statement before confirming — bank, sender and reference are not captured by the system."}
            </p>
            <a
              href={waLink(order.customer.phone, `Hi ${order.customer.name}, regarding your OCare Phinas order ${order.reference}…`)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#1eb85a] text-white font-semibold text-caption px-3 py-2 transition-colors"
            >
              <MessageCircle className="size-4" /> Message customer
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
