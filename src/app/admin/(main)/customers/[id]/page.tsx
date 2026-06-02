import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight, Mail, MessageCircle, Phone, ShieldCheck, ShoppingBag, User, Users, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { naira } from "@/lib/pay-small-small";
import { getCustomer, getCustomerOrders, getCustomerPayments, walletBalance } from "@/lib/customers";
import { STATUS_META, PLAN_META } from "@/lib/orders";
import { waLink } from "@/lib/whatsapp";
import { DecisionActions } from "@/components/admin/decision-actions";
import { CustomerBlockControl } from "./customer-actions";

export const metadata: Metadata = { title: "Customer — OCare Phinas Admin" };

const PLAN_ICON = { solo: User, group: Users } as const;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const customer = getCustomer(id);
  if (!customer) notFound();

  const orders = getCustomerOrders(customer);
  const payments = getCustomerPayments(customer);
  const w = customer.wallet;
  const balance = walletBalance(w);

  const walletCells = [
    { label: "Solo payments", value: w.soloAllocations },
    { label: "Group payments", value: w.groupAllocations },
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
        <CustomerBlockControl name={customer.name} initialBlocked={customer.blocked} />
      </div>

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
            <div className="space-y-2">
              {customer.plans.map((p) => {
                const Icon = PLAN_ICON[p.type];
                return (
                  <div key={p.reference} className="flex items-center gap-2 text-body-sm">
                    <Icon className="size-4 text-primary" />
                    <span className="font-medium">{p.type === "solo" ? "Solo plan" : "Group plan"}</span>
                    <span className="text-muted-foreground font-mono">· {p.reference}</span>
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

      {/* Payments awaiting confirmation */}
      {payments.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-body font-semibold">Payments to review</h2>
          {payments.map((p) => (
            <div key={p.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                <div>
                  <p className="text-body font-bold font-mono">{p.orderRef}</p>
                  <p className="text-caption text-muted-foreground">Submitted {p.submittedAt} · screenshot sent on WhatsApp</p>
                </div>
                <p className="text-h3 font-bold text-primary">{naira(p.amount)}</p>
              </div>
              <DecisionActions
                reference={p.orderRef}
                initialStatus={p.status}
                confirmLabel="Confirm payment"
                rejectLabel="Reject"
                confirmToast={`${p.orderRef} confirmed — order marked confirmed and stock decremented.`}
                rejectToast={`${p.orderRef} payment rejected.`}
                note="Verify the WhatsApp screenshot against your bank statement first — bank, sender and reference are not captured by the system."
              />
            </div>
          ))}
        </div>
      )}

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
              const meta = STATUS_META[order.status];
              const plan = PLAN_META[order.paymentPlan];
              return (
                <Link key={order.id} href={`/admin/orders/${order.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-mono font-semibold">{order.reference}</p>
                    <p className="text-caption text-muted-foreground">
                      {new Date(order.date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })} · {plan.label}
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
