import type { Metadata } from "next";
import Link from "next/link";
import { TrendingUp, CreditCard, Wallet, AlertTriangle, Users, ShoppingBag, ArrowRight, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { MOCK_ORDERS, STATUS_META } from "@/lib/orders";
import { MOCK_PAYMENTS } from "@/lib/payments";

export const metadata: Metadata = { title: "Dashboard — OCare Phinas Admin" };

const RECENT_ORDERS = MOCK_ORDERS.slice(0, 4);
const PENDING_PAYMENTS = MOCK_PAYMENTS.filter((p) => p.status === "awaiting").slice(0, 3);

const STATS = [
  { label: "Today's sales", value: "₦142,490", sub: "+3 orders", icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
  { label: "Pending payments", value: "7", sub: "Awaiting confirmation", icon: CreditCard, color: "text-warning", bg: "bg-warning/10", href: "/admin/payments" },
  { label: "Pending contributions", value: "12", sub: "Plan payments to confirm", icon: Wallet, color: "text-accent", bg: "bg-accent/10", href: "/admin/contributions" },
  { label: "Low stock products", value: "5", sub: "Below 3 units", icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10", href: "/admin/products" },
  { label: "Open groups", value: "3", sub: "Active PSS groups", icon: Users, color: "text-primary", bg: "bg-primary/10", href: "/admin/groups" },
  { label: "Total orders", value: "248", sub: "All time", icon: ShoppingBag, color: "text-muted-foreground", bg: "bg-muted" },
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
            <h2 className="text-body font-semibold">Pending Payments</h2>
            <Link href="/admin/payments" className="flex items-center gap-1 text-caption text-primary font-medium hover:underline">
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {PENDING_PAYMENTS.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-mono font-semibold">{p.orderRef}</p>
                  <p className="text-caption text-muted-foreground">{p.customer.name} · submitted {p.submittedAt}</p>
                </div>
                <p className="text-body-sm font-bold text-primary flex-shrink-0">₦{p.amount.toLocaleString("en-NG")}</p>
                <Link href={`/admin/payments/${p.id}`} className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-primary text-white text-caption font-semibold hover:bg-primary/90 transition-colors">
                  Review
                </Link>
              </div>
            ))}
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
