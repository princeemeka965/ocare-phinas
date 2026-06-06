import type { Metadata } from "next";
import Link from "next/link";
import { TrendingUp, CreditCard, AlertTriangle, Users, Package, ArrowRight, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { MOCK_ORDERS, STATUS_META } from "@/lib/orders";
import { arrearsAcrossCustomers } from "@/lib/customers";
import { naira } from "@/lib/pay-small-small";

export const metadata: Metadata = { title: "Dashboard — OCare Phinas Admin" };

const RECENT_ORDERS = MOCK_ORDERS.slice(0, 4);
/* Outright orders whose manual transfer is awaiting confirmation. Plan orders
   are confirmed period-by-period inside the order's payment record instead. */
const AWAITING_CONFIRMATION = MOCK_ORDERS.filter((o) => o.status === "payment_submitted");

const ARREARS = arrearsAcrossCustomers();
const OVERDUE = ARREARS.filter((r) => r.health.status === "overdue");
const MISSED = ARREARS.filter((r) => r.health.status === "missed");
const OVERDUE_TOTAL = OVERDUE.reduce((s, r) => s + r.health.arrears, 0);
const MISSED_TOTAL = MISSED.reduce((s, r) => s + r.health.arrears, 0);

const STATS = [
  { label: "Today's sales", value: "₦142,490", sub: "+3 orders", icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
  { label: "Awaiting confirmation", value: String(AWAITING_CONFIRMATION.length), sub: "Order payments to confirm", icon: CreditCard, color: "text-warning", bg: "bg-warning/10", href: "/admin/orders" },
  { label: "Overdue plans", value: String(OVERDUE.length), sub: `${naira(OVERDUE_TOTAL)} past due`, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10", href: "/admin/arrears" },
  { label: "Missed payments", value: String(MISSED.length), sub: `${naira(MISSED_TOTAL)} behind`, icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", href: "/admin/arrears" },
  { label: "Open groups", value: "3", sub: "Active PSS groups", icon: Users, color: "text-primary", bg: "bg-primary/10", href: "/admin/groups" },
  { label: "Low stock products", value: "5", sub: "Below 3 units", icon: Package, color: "text-muted-foreground", bg: "bg-muted", href: "/admin/products" },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-h1 font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          const card = (
            <div className="h-full rounded-2xl border border-border bg-card p-5 hover:shadow-md transition-shadow">
              <div className={`flex size-10 items-center justify-center rounded-xl ${stat.bg} mb-3`}>
                <Icon className={`size-5 ${stat.color}`} />
              </div>
              <p className="text-h2 font-bold break-words">{stat.value}</p>
              <p className="text-body-sm font-medium text-muted-foreground mt-0.5">{stat.label}</p>
              <p className="text-caption text-muted-foreground">{stat.sub}</p>
            </div>
          );
          return stat.href ? (
            <Link key={stat.label} href={stat.href} className="block h-full">{card}</Link>
          ) : (
            <div key={stat.label} className="h-full">{card}</div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-body font-semibold">Awaiting confirmation</h2>
            <Link href="/admin/orders" className="flex items-center gap-1 text-caption text-primary font-medium hover:underline">
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {AWAITING_CONFIRMATION.length === 0 ? (
              <p className="px-5 py-8 text-center text-body-sm text-muted-foreground">No order payments awaiting confirmation.</p>
            ) : (
              AWAITING_CONFIRMATION.map((o) => (
                <div key={o.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-mono font-semibold">{o.reference}</p>
                    <p className="text-caption text-muted-foreground">{o.customer.name} · placed {o.date}</p>
                  </div>
                  <p className="text-body-sm font-bold text-primary flex-shrink-0">₦{o.total.toLocaleString("en-NG")}</p>
                  <Link href={`/admin/orders/${o.id}`} className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-primary text-white text-caption font-semibold hover:bg-primary/90 transition-colors">
                    Review
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-body font-semibold">Recent Orders</h2>
            <Link href="/admin/orders" className="flex items-center gap-1 text-caption text-primary font-medium hover:underline">
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {RECENT_ORDERS.map((order) => {
              const meta = STATUS_META[order.status];
              return (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-mono font-semibold">{order.reference}</p>
                    <p className="text-caption text-muted-foreground">{order.customer.name}</p>
                  </div>
                  <Badge variant={meta.variant} className="text-micro flex-shrink-0">{meta.label}</Badge>
                  <p className="text-body-sm font-bold text-primary flex-shrink-0">₦{order.total.toLocaleString("en-NG")}</p>
                  <ChevronRight className="size-4 text-muted-foreground/50 group-hover:text-muted-foreground flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
