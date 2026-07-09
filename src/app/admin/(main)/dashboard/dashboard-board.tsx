"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, AlertTriangle, Users, Package, ArrowRight, ChevronRight, Sun } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { STATUS_META, type OrderStatus } from "@/lib/orders";
import { naira } from "@/lib/pay-small-small";

interface RecentOrder {
  id: string;
  reference: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  customer: { name: string };
}

interface Stats {
  awaitingConfirmation: number;
  openGroups: number;
  lowStock: number;
  overdue: { count: number; total: number };
  missed: { count: number; total: number };
  recentOrders: RecentOrder[];
  solarAwaitingReview: number;
}

export function DashboardBoard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [awaiting, setAwaiting] = useState<RecentOrder[]>([]);

  useEffect(() => {
    api.get<Stats>("/api/admin/stats").then(setStats).catch(() => {});
    api
      .get<{ orders: RecentOrder[] }>("/api/admin/orders?status=payment_submitted")
      .then((d) => setAwaiting(d.orders))
      .catch(() => {});
  }, []);

  if (!stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl border border-border bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  const cards = [
    { label: "Awaiting confirmation", value: String(stats.awaitingConfirmation), sub: "Order payments to confirm", icon: CreditCard, color: "text-warning", bg: "bg-warning/10", href: "/admin/orders" },
    { label: "Overdue plans", value: String(stats.overdue.count), sub: `${naira(stats.overdue.total)} past due`, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10", href: "/admin/arrears" },
    { label: "Missed payments", value: String(stats.missed.count), sub: `${naira(stats.missed.total)} behind`, icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", href: "/admin/arrears" },
    { label: "Open groups", value: String(stats.openGroups), sub: "Active PSS groups", icon: Users, color: "text-primary", bg: "bg-primary/10", href: "/admin/groups" },
    { label: "Low stock products", value: String(stats.lowStock), sub: "Below 3 units", icon: Package, color: "text-muted-foreground", bg: "bg-muted", href: "/admin/products" },
    { label: "Solar applications awaiting review", value: String(stats.solarAwaitingReview), sub: "KYC submissions to verify", icon: Sun, color: "text-primary", bg: "bg-primary/10", href: "/admin/solar" },
  ];

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {cards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href} className="block h-full">
              <div className="h-full rounded-2xl border border-border bg-card p-5 hover:shadow-md transition-shadow">
                <div className={`flex size-10 items-center justify-center rounded-xl ${stat.bg} mb-3`}>
                  <Icon className={`size-5 ${stat.color}`} />
                </div>
                <p className="text-h2 font-bold break-words">{stat.value}</p>
                <p className="text-body-sm font-medium text-muted-foreground mt-0.5">{stat.label}</p>
                <p className="text-caption text-muted-foreground">{stat.sub}</p>
              </div>
            </Link>
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
            {awaiting.length === 0 ? (
              <p className="px-5 py-8 text-center text-body-sm text-muted-foreground">No order payments awaiting confirmation.</p>
            ) : (
              awaiting.map((o) => (
                <div key={o.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-mono font-semibold">{o.reference}</p>
                    <p className="text-caption text-muted-foreground">
                      {o.customer.name} · placed {new Date(o.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                    </p>
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
            {stats.recentOrders.length === 0 ? (
              <p className="px-5 py-8 text-center text-body-sm text-muted-foreground">No orders yet.</p>
            ) : (
              stats.recentOrders.map((order) => {
                const meta = STATUS_META[order.status] ?? STATUS_META.pending_payment;
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
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
