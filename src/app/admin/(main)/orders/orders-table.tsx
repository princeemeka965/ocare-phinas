"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type Order, type OrderStatus, STATUS_META, PLAN_META } from "@/lib/orders";

const TABS: { label: string; status: OrderStatus | "all" }[] = [
  { label: "All", status: "all" },
  { label: "Awaiting confirmation", status: "payment_submitted" },
  { label: "In plan", status: "in_plan" },
  { label: "Confirmed", status: "confirmed" },
  { label: "Processing", status: "processing" },
  { label: "Shipped", status: "shipped" },
  { label: "Delivered", status: "delivered" },
  { label: "Cancelled", status: "cancelled" },
];

export function OrdersTable({ orders }: { orders: Order[] }) {
  const [active, setActive] = useState<OrderStatus | "all">("all");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const searched = q
    ? orders.filter((o) =>
        [
          o.reference,
          o.customer.name,
          o.customer.email,
          o.customer.phone,
          ...o.items.map((i) => i.name),
        ].some((v) => v.toLowerCase().includes(q)),
      )
    : orders;

  const filtered = active === "all" ? searched : searched.filter((o) => o.status === active);

  return (
    <>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search reference, customer, phone or item…"
          className="w-full h-9 pl-10 pr-4 rounded-lg border border-input bg-background text-body-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-colors"
        />
      </div>

      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none border-b border-border pb-px">
        {TABS.map((tab) => {
          const isActive = tab.status === active;
          const count = tab.status === "all" ? searched.length : searched.filter((o) => o.status === tab.status).length;
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

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-body-sm text-muted-foreground">
          {q ? `No orders match “${query.trim()}”.` : "No orders in this status."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const meta = STATUS_META[order.status];
            const plan = PLAN_META[order.paymentPlan];
            const PlanIcon = plan.icon;
            const itemCount = order.items.reduce((s, i) => s + i.qty, 0);
            return (
              <div
                key={order.id}
                className="rounded-2xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
              >
                {/* Reference + plan */}
                <div className="flex items-center gap-3 sm:w-56 min-w-0">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                    <PlanIcon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-body-sm font-semibold font-mono truncate">{order.reference}</p>
                    <Badge variant={plan.variant} className="text-micro gap-1 mt-1"><PlanIcon className="size-3" />{plan.label}</Badge>
                  </div>
                </div>

                {/* Customer + date */}
                <div className="sm:flex-1 min-w-0">
                  <p className="text-body-sm font-medium truncate">{order.customer.name}</p>
                  <p className="text-caption text-muted-foreground">
                    {new Date(order.date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })} · {itemCount} item{itemCount !== 1 ? "s" : ""}
                  </p>
                </div>

                {/* Total + status */}
                <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
                  <span className="text-body-sm font-bold text-primary">₦{order.total.toLocaleString("en-NG")}</span>
                  <Badge variant={meta.variant} className="text-micro">{meta.label}</Badge>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 sm:flex-shrink-0 border-t border-border pt-3 sm:border-t-0 sm:pt-0">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-border text-body-sm font-medium hover:bg-muted transition-colors"
                  >
                    <Eye className="size-4" /> View
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
