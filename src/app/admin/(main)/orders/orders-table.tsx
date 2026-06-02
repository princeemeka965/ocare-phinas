"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type Order, type OrderStatus, STATUS_META, PLAN_META } from "@/lib/orders";

const TABS: { label: string; status: OrderStatus | "all" }[] = [
  { label: "All", status: "all" },
  { label: "Awaiting confirmation", status: "payment_submitted" },
  { label: "Confirmed", status: "confirmed" },
  { label: "Processing", status: "processing" },
  { label: "Shipped", status: "shipped" },
  { label: "Delivered", status: "delivered" },
  { label: "Cancelled", status: "cancelled" },
];

export function OrdersTable({ orders }: { orders: Order[] }) {
  const [active, setActive] = useState<OrderStatus | "all">("all");

  const filtered = active === "all" ? orders : orders.filter((o) => o.status === active);

  return (
    <>
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none border-b border-border pb-px">
        {TABS.map((tab) => {
          const isActive = tab.status === active;
          const count = tab.status === "all" ? orders.length : orders.filter((o) => o.status === tab.status).length;
          return (
            <button
              key={tab.label}
              onClick={() => setActive(tab.status)}
              aria-pressed={isActive}
              className={cn(
                "flex-shrink-0 px-3 py-2 text-body-sm font-medium border-b-2 -mb-px transition-colors",
                isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              <span className={cn("ml-1.5 text-caption", isActive ? "text-primary/70" : "text-muted-foreground/60")}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Reference</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground hidden sm:table-cell">Customer</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground hidden md:table-cell">Date</th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Total</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-body-sm text-muted-foreground">
                    No orders in this status.
                  </td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const meta = STATUS_META[order.status];
                  const plan = PLAN_META[order.paymentPlan];
                  const PlanIcon = plan.icon;
                  return (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-mono font-semibold">{order.reference}</p>
                        <Badge variant={plan.variant} className="text-micro gap-1 mt-1"><PlanIcon className="size-3" />{plan.label}</Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{order.customer.name}</td>
                      <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{new Date(order.date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td className="py-3 px-4 text-right font-bold text-primary">₦{order.total.toLocaleString("en-NG")}</td>
                      <td className="py-3 px-4"><Badge variant={meta.variant} className="text-micro">{meta.label}</Badge></td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          aria-label={`View order ${order.reference}`}
                          title="View order"
                          className="inline-flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Eye className="size-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
