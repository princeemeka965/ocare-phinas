import type { Metadata } from "next";
import Link from "next/link";
import { Package, ChevronRight, ShoppingBag } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My Orders — OCare Phinas",
};

type OrderStatus =
  | "pending_payment"
  | "payment_submitted"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

interface Order {
  id: string;
  reference: string;
  date: string;
  total: number;
  status: OrderStatus;
  items: { name: string; qty: number }[];
}

/* Mock data — replace with authenticated server fetch in Phase 3 */
const MOCK_ORDERS: Order[] = [
  { id: "1", reference: "OCP-2026-00042", date: "2026-05-25", total: 65990, status: "confirmed", items: [{ name: "Samsung Galaxy S24 Ultra 256GB", qty: 1 }] },
  { id: "2", reference: "OCP-2026-00038", date: "2026-05-18", total: 22990, status: "delivered", items: [{ name: "Sony WH-1000XM5 Headphones", qty: 1 }] },
  { id: "3", reference: "OCP-2026-00031", date: "2026-05-10", total: 18900, status: "payment_submitted", items: [{ name: "Panasonic Microwave 20L", qty: 1 }] },
];

const STATUS_META: Record<OrderStatus, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
  pending_payment: { label: "Pending payment", variant: "warning" },
  payment_submitted: { label: "Awaiting confirmation", variant: "warning" },
  confirmed: { label: "Confirmed", variant: "success" },
  processing: { label: "Processing", variant: "default" },
  shipped: { label: "Shipped", variant: "default" },
  delivered: { label: "Delivered", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

export default function OrdersPage() {
  if (MOCK_ORDERS.length === 0) {
    return (
      <div className="py-20">
        <Container>
          <div className="flex flex-col items-center justify-center text-center py-16 max-w-sm mx-auto">
            <div className="flex size-20 items-center justify-center rounded-full bg-muted mb-5">
              <ShoppingBag className="size-9 text-muted-foreground" />
            </div>
            <h1 className="text-h2 font-bold mb-2">No orders yet</h1>
            <p className="text-body-sm text-muted-foreground mb-8">
              You haven&apos;t placed any orders yet. Start shopping and your orders will appear here.
            </p>
            <Link href="/products" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
              <ShoppingBag className="size-5" /> Start shopping
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12">
      <Container className="max-w-3xl">
        <h1 className="text-h1 font-bold mb-8">My Orders</h1>

        <div className="space-y-4">
          {MOCK_ORDERS.map((order) => {
            const meta = STATUS_META[order.status];
            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-md transition-all duration-200"
              >
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                  <Package className="size-6 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-body-sm font-bold font-mono">{order.reference}</span>
                    <Badge variant={meta.variant} className="text-micro">{meta.label}</Badge>
                  </div>
                  <p className="text-caption text-muted-foreground">
                    {order.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}
                  </p>
                  <p className="text-caption text-muted-foreground mt-0.5">
                    {new Date(order.date).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-body font-bold text-primary">
                    ₦{order.total.toLocaleString("en-NG")}
                  </p>
                  <ChevronRight className="size-4 text-muted-foreground mt-1 ml-auto group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </Container>
    </div>
  );
}
