"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, ChevronRight, Clock, Mail, MessageCircle, Phone, ShieldCheck, ShoppingBag, Truck, User, Users, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { naira, SOLO_FREQUENCIES } from "@/lib/pay-small-small";
import { HEALTH_META, isArrears, type PaymentHealth } from "@/lib/payment-health";
import { STATUS_META, PLAN_META, type OrderStatus } from "@/lib/orders";
import { waLink } from "@/lib/whatsapp";
import { CustomerBlockControl } from "./customer-actions";

const PLAN_ICON = { solo: User, group: Users } as const;

interface CustomerPlan {
  id: string;
  type: "solo" | "group";
  reference: string | null;
  productName: string | null;
  productPrice: number;
  amountAllocated: number;
  status: string;
  delivered: boolean;
  health: PaymentHealth | null;
}

interface CustomerOrder {
  id: string;
  reference: string;
  status: OrderStatus;
  paymentPlan: "outright" | "solo" | "group";
  total: number;
  createdAt: string;
}

interface CustomerDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  verified: boolean;
  blocked: boolean;
  joined: string;
  wallet: { total: number; available: number; spentOnProducts: number };
  plans: CustomerPlan[];
  orders: CustomerOrder[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CustomerDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get<{ customer: CustomerDetail }>(`/api/admin/customers/${id}`)
      .then((d) => setCustomer(d.customer))
      .catch(() => setError(true));
  }, [id]);

  if (error) {
    return (
      <div className="max-w-5xl space-y-6">
        <Link href="/admin/customers" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2 -ml-2")}>
          <ArrowLeft className="size-4" /> All customers
        </Link>
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-body-sm text-muted-foreground">
          Customer not found.
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="max-w-5xl space-y-6">
        <div className="h-8 w-36 rounded bg-muted animate-pulse" />
        <div className="h-24 rounded-2xl border border-border bg-card animate-pulse" />
        <div className="h-40 rounded-3xl bg-muted animate-pulse" />
      </div>
    );
  }

  const orders = customer.orders;
  const w = customer.wallet;
  const balance = w.total;

  const soloAllocations = customer.plans.filter((p) => p.type === "solo").reduce((s, p) => s + p.amountAllocated, 0);
  const groupAllocations = customer.plans.filter((p) => p.type === "group").reduce((s, p) => s + p.amountAllocated, 0);

  const arrearsPlans = customer.plans.filter((p) => p.health && isArrears(p.health.status));
  const hasOverdue = arrearsPlans.some((p) => p.health!.status === "overdue");
  const arrearsTotal = arrearsPlans.reduce((s, p) => s + p.health!.arrears, 0);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

  const walletCells = [
    { label: "Solo payments", value: soloAllocations },
    { label: "Group payments", value: groupAllocations },
    { label: "Available balance", value: w.available },
    { label: "Spent on products", value: w.spentOnProducts },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <Link href="/admin/customers" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2 -ml-2")}>
        <ArrowLeft className="size-4" /> All customers
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-h3 flex-shrink-0">
            {customer.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-h2 font-bold">{customer.name}</h1>
              {customer.verified && <ShieldCheck className="size-4 text-success" aria-label="Verified" />}
            </div>
            <p className="text-caption text-muted-foreground">
              Joined {new Date(customer.joined).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
        <CustomerBlockControl id={customer.id} name={customer.name} initialBlocked={customer.blocked} />
      </div>

      {/* Arrears alert */}
      {arrearsPlans.length > 0 && (
        <div
          className={cn(
            "rounded-2xl border p-4 flex items-start gap-3",
            hasOverdue ? "border-destructive/30 bg-destructive/5" : "border-warning/40 bg-warning/10",
          )}
        >
          <AlertTriangle className={cn("size-5 flex-shrink-0 mt-0.5", hasOverdue ? "text-destructive" : "text-warning")} />
          <div className="min-w-0">
            <p className="text-body-sm font-semibold">
              {hasOverdue
                ? `${naira(arrearsTotal)} in arrears — ${arrearsPlans.length} plan${arrearsPlans.length !== 1 ? "s" : ""} behind, some overdue`
                : `${naira(arrearsTotal)} behind on ${arrearsPlans.length} plan${arrearsPlans.length !== 1 ? "s" : ""}`}
            </p>
            <a
              href={waLink(
                customer.phone,
                `Hi ${customer.name}, this is OCare Phinas. You have ${naira(arrearsTotal)} outstanding on your plan${arrearsPlans.length !== 1 ? "s" : ""}. Please catch up so we can keep your account in good standing.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-caption font-medium text-primary hover:underline"
            >
              <MessageCircle className="size-3.5" /> Send a payment reminder on WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* Contact + plans */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-body font-semibold mb-3">Contact</h2>
          <div className="space-y-2 text-body-sm">
            <p className="flex items-center gap-2 text-muted-foreground"><Mail className="size-3.5 flex-shrink-0" /> {customer.email}</p>
            <p className="flex items-center gap-2 text-muted-foreground"><Phone className="size-3.5 flex-shrink-0" /> {customer.phone}</p>
          </div>
          <a
            href={waLink(customer.phone, `Hi ${customer.name}, this is OCare Phinas…`)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#1eb85a] text-white font-semibold text-caption px-3 py-2 transition-colors"
          >
            <MessageCircle className="size-4" /> Message on WhatsApp
          </a>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-body font-semibold mb-3">Pay Small Small plans</h2>
          {customer.plans.length === 0 ? (
            <p className="text-body-sm text-muted-foreground">No active plans.</p>
          ) : (
            <div className="space-y-3">
              {customer.plans.map((p) => {
                const Icon = PLAN_ICON[p.type];
                const health = p.health;
                return (
                  <div key={p.id}>
                    <div className="flex items-center gap-2 text-body-sm flex-wrap">
                      <Icon className="size-4 text-primary" />
                      <span className="font-medium">{p.type === "solo" ? "Solo plan" : "Group plan"}</span>
                      {p.reference && <span className="text-muted-foreground font-mono">· {p.reference}</span>}
                      {p.delivered && (
                        <span className="inline-flex items-center gap-0.5 text-micro text-success"><Truck className="size-3" /> delivered</span>
                      )}
                      {health && (
                        <Badge variant={HEALTH_META[health.status].badge} className="text-micro gap-1">
                          {health.status === "overdue" ? <AlertTriangle className="size-3" /> : health.status === "missed" ? <Clock className="size-3" /> : null}
                          {HEALTH_META[health.status].label}
                        </Badge>
                      )}
                    </div>
                    {health && isArrears(health.status) && (
                      <p className="text-caption text-muted-foreground mt-1 pl-6">
                        {health.status === "overdue" ? (
                          <>{naira(health.arrears)} overdue · due by {fmtDate(health.completionDeadline)} ({health.daysOverdue} day{health.daysOverdue !== 1 ? "s" : ""} ago)</>
                        ) : (
                          <>{naira(health.arrears)} behind · {health.missedPeriods} {SOLO_FREQUENCIES[health.frequency].unit}{health.missedPeriods !== 1 ? "s" : ""} missed · next due {fmtDate(health.nextDueDate)}</>
                        )}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Wallet */}
      <div className="rounded-3xl p-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg, oklch(0.50 0.15 150), oklch(0.45 0.14 150))" }}>
        <div aria-hidden className="absolute -right-12 -top-12 size-56 rounded-full opacity-20 blur-3xl" style={{ background: "oklch(0.72 0.17 78)" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="size-4 text-white/70" />
            <span className="text-caption font-semibold text-white/70 uppercase tracking-wide">Wallet balance</span>
          </div>
          <p className="text-display font-bold text-white leading-none mb-6">{naira(balance)}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {walletCells.map((cell) => (
              <div key={cell.label} className="rounded-2xl bg-white/10 backdrop-blur-sm p-4">
                <p className="text-micro text-white/60 uppercase tracking-wide mb-1">{cell.label}</p>
                <p className="text-body font-bold text-white">{naira(cell.value)}</p>
              </div>
            ))}
          </div>
          <p className="text-caption text-white/60 mt-4">
            Money is never withdrawn as cash — allocations and available balance only ever become products.
          </p>
        </div>
      </div>

      {/* Orders */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-body font-semibold flex items-center gap-2"><ShoppingBag className="size-4" /> Orders ({orders.length})</h2>
        </div>
        {orders.length === 0 ? (
          <p className="px-5 py-8 text-center text-body-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {orders.map((order) => {
              const meta = STATUS_META[order.status] ?? STATUS_META.pending_payment;
              const plan = PLAN_META[order.paymentPlan];
              return (
                <Link key={order.id} href={`/admin/orders/${order.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-mono font-semibold">{order.reference}</p>
                    <p className="text-caption text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })} · {plan.label}
                    </p>
                  </div>
                  <Badge variant={meta.variant} className="text-micro flex-shrink-0">{meta.label}</Badge>
                  <p className="text-body-sm font-bold text-primary flex-shrink-0">{naira(order.total)}</p>
                  <ChevronRight className="size-4 text-muted-foreground/50 group-hover:text-muted-foreground flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
