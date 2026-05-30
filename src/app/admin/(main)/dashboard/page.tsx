import type { Metadata } from "next";
import Link from "next/link";
import { TrendingUp, CreditCard, Wallet, AlertTriangle, Users, ShoppingBag, ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Dashboard — OCare Phinas Admin" };

const STATS = [
  { label: "Today's sales", value: "₦142,490", sub: "+3 orders", icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
  { label: "Pending payments", value: "7", sub: "Awaiting confirmation", icon: CreditCard, color: "text-warning", bg: "bg-warning/10", href: "/admin/payments" },
  { label: "Pending contributions", value: "12", sub: "Plan payments to confirm", icon: Wallet, color: "text-accent", bg: "bg-accent/10", href: "/admin/contributions" },
  { label: "Low stock products", value: "5", sub: "Below 3 units", icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10", href: "/admin/products" },
  { label: "Open groups", value: "3", sub: "Active PSS groups", icon: Users, color: "text-primary", bg: "bg-primary/10", href: "/admin/groups" },
  { label: "Total orders", value: "248", sub: "All time", icon: ShoppingBag, color: "text-muted-foreground", bg: "bg-muted" },
];

const PENDING_PAYMENTS = [
  { ref: "OCP-2026-00051", customer: "Adaeze Okonkwo", amount: 65990, bank: "GTBank", time: "2 hrs ago" },
  { ref: "OCP-2026-00050", customer: "Emeka Nwosu", amount: 22990, bank: "Access Bank", time: "3 hrs ago" },
  { ref: "OCP-2026-00049", customer: "Bola Adesanya", amount: 18900, bank: "Zenith", time: "5 hrs ago" },
];

const RECENT_ORDERS = [
  { ref: "OCP-2026-00051", customer: "Adaeze Okonkwo", total: 65990, status: "payment_submitted" as const },
  { ref: "OCP-2026-00050", customer: "Emeka Nwosu", total: 22990, status: "confirmed" as const },
  { ref: "OCP-2026-00049", customer: "Bola Adesanya", total: 18900, status: "shipped" as const },
  { ref: "OCP-2026-00048", customer: "Chukwuemeka Anyanwu", total: 79990, status: "delivered" as const },
];

const STATUS_META = {
  pending_payment: { label: "Pending payment", variant: "warning" as const },
  payment_submitted: { label: "Awaiting confirm", variant: "warning" as const },
  confirmed: { label: "Confirmed", variant: "success" as const },
  processing: { label: "Processing", variant: "default" as const },
  shipped: { label: "Shipped", variant: "default" as const },
  delivered: { label: "Delivered", variant: "success" as const },
  cancelled: { label: "Cancelled", variant: "destructive" as const },
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-h1 font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          const card = (
            <div className="rounded-2xl border border-border bg-card p-5 hover:shadow-md transition-shadow">
              <div className={`flex size-10 items-center justify-center rounded-xl ${stat.bg} mb-3`}>
                <Icon className={`size-5 ${stat.color}`} />
              </div>
              <p className="text-h2 font-bold">{stat.value}</p>
              <p className="text-body-sm font-medium text-muted-foreground mt-0.5">{stat.label}</p>
              <p className="text-caption text-muted-foreground">{stat.sub}</p>
            </div>
          );
          return stat.href ? (
            <Link key={stat.label} href={stat.href} className="block">{card}</Link>
          ) : (
            <div key={stat.label}>{card}</div>
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
              <div key={p.ref} className="flex items-center gap-3 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-mono font-semibold">{p.ref}</p>
                  <p className="text-caption text-muted-foreground">{p.customer} · {p.bank} · {p.time}</p>
                </div>
                <p className="text-body-sm font-bold text-primary flex-shrink-0">₦{p.amount.toLocaleString("en-NG")}</p>
                <Link href="/admin/payments" className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-primary text-white text-caption font-semibold hover:bg-primary/90 transition-colors">
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
                <div key={order.ref} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-mono font-semibold">{order.ref}</p>
                    <p className="text-caption text-muted-foreground">{order.customer}</p>
                  </div>
                  <Badge variant={meta.variant} className="text-micro flex-shrink-0">{meta.label}</Badge>
                  <p className="text-body-sm font-bold text-primary flex-shrink-0">₦{order.total.toLocaleString("en-NG")}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
