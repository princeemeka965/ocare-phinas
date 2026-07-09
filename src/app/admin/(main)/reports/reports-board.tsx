"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Wallet as WalletIcon, AlertTriangle, PiggyBank, ShoppingCart, User, Users, Sun } from "lucide-react";

import { api } from "@/lib/api";
import { naira } from "@/lib/pay-small-small";
import type { PlanType } from "@/lib/db/types";

interface ReportsData {
  revenue: {
    total: number;
    thisMonth: number;
    byType: Record<PlanType, number>;
    thisMonthByType: Record<PlanType, number>;
  };
  outstanding: {
    expectedRemainingTotal: number;
    expectedRemainingByType: Record<PlanType, number>;
    arrears: { status: string; total: number; overdueTotal: number; missedTotal: number; count: number };
  };
  wallets: {
    totalBalance: number;
    registrationFeesTotal: number;
  };
}

const PLAN_TYPE_META: Record<PlanType, { label: string; icon: typeof ShoppingCart }> = {
  outright: { label: "Outright", icon: ShoppingCart },
  solo: { label: "Solo Plan", icon: User },
  group: { label: "Group Plan", icon: Users },
  solar: { label: "Solar Plan", icon: Sun },
};

function StatCard({
  label, value, sub, icon: Icon, color, bg,
}: { label: string; value: string; sub?: string; icon: typeof TrendingUp; color: string; bg: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className={`flex size-10 items-center justify-center rounded-xl ${bg} mb-3`}>
        <Icon className={`size-5 ${color}`} />
      </div>
      <p className="text-h2 font-bold break-words">{value}</p>
      <p className="text-body-sm font-medium text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-caption text-muted-foreground">{sub}</p>}
    </div>
  );
}

function BreakdownTable({ title, byType }: { title: string; byType: Record<PlanType, number> }) {
  const types = (Object.keys(PLAN_TYPE_META) as PlanType[]).filter((t) => byType[t] > 0);
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-body font-semibold">{title}</h2>
      </div>
      {types.length === 0 ? (
        <p className="px-5 py-8 text-center text-body-sm text-muted-foreground">No data yet.</p>
      ) : (
        <div className="divide-y divide-border">
          {types.map((t) => {
            const meta = PLAN_TYPE_META[t];
            const Icon = meta.icon;
            return (
              <div key={t} className="flex items-center gap-3 px-5 py-3.5">
                <Icon className="size-4 text-muted-foreground flex-shrink-0" />
                <p className="flex-1 text-body-sm font-medium">{meta.label}</p>
                <p className="text-body-sm font-bold text-primary">{naira(byType[t])}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ReportsBoard() {
  const [data, setData] = useState<ReportsData | null>(null);

  useEffect(() => {
    api.get<ReportsData>("/api/admin/reports").then(setData).catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl border border-border bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  const { revenue, outstanding, wallets } = data;

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-body font-semibold text-muted-foreground uppercase tracking-wide text-micro">Revenue realized</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard label="All time" value={naira(revenue.total)} sub="Confirmed payments in" icon={TrendingUp} color="text-success" bg="bg-success/10" />
          <StatCard label="This month" value={naira(revenue.thisMonth)} sub="Confirmed this calendar month" icon={TrendingUp} color="text-primary" bg="bg-primary/10" />
        </div>
        <BreakdownTable title="Revenue by plan type (all time)" byType={revenue.byType} />
      </section>

      <section className="space-y-4">
        <h2 className="text-body font-semibold text-muted-foreground uppercase tracking-wide text-micro">Outstanding &amp; expected payments</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard label="Expected remaining" value={naira(outstanding.expectedRemainingTotal)} sub="Still owed on ongoing plans" icon={PiggyBank} color="text-primary" bg="bg-primary/10" />
          <StatCard label="Overdue" value={naira(outstanding.arrears.overdueTotal)} sub={`${outstanding.arrears.count} plan${outstanding.arrears.count !== 1 ? "s" : ""} in arrears`} icon={AlertTriangle} color="text-destructive" bg="bg-destructive/10" />
          <StatCard label="Missed" value={naira(outstanding.arrears.missedTotal)} sub="Behind schedule, not yet overdue" icon={AlertTriangle} color="text-warning" bg="bg-warning/10" />
        </div>
        <BreakdownTable title="Expected remaining by plan type" byType={outstanding.expectedRemainingByType} />
      </section>

      <section className="space-y-4">
        <h2 className="text-body font-semibold text-muted-foreground uppercase tracking-wide text-micro">Wallet &amp; registration fees</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard label="Total wallet balance" value={naira(wallets.totalBalance)} sub="Sum across every customer wallet" icon={WalletIcon} color="text-primary" bg="bg-primary/10" />
          <StatCard label="Registration fees collected" value={naira(wallets.registrationFeesTotal)} sub="Solar KYC fees — never reversible" icon={Sun} color="text-accent-foreground" bg="bg-accent/15" />
        </div>
      </section>
    </div>
  );
}
