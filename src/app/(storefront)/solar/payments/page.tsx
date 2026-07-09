"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sun,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  MessageCircle,
} from "lucide-react";

import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useUserStore } from "@/store/userStore";
import { useBankSettings } from "@/hooks/useBankSettings";
import { AuthRequired } from "@/components/storefront/auth-required";
import { naira, SOLO_FREQUENCIES } from "@/lib/pay-small-small";
import { waHref } from "@/lib/whatsapp";
import type { PlanPeriod, PlanPeriodStatus } from "@/lib/payment-health";
import type { Plan, SolarApplication, SolarPackage } from "@/lib/db/types";

const PERIOD_META: Record<PlanPeriodStatus, { label: string; badge: "success" | "warning" | "destructive" | "secondary" | "default"; icon: typeof Circle }> = {
  paid: { label: "Confirmed", badge: "success", icon: CheckCircle2 },
  due: { label: "Due now", badge: "default", icon: Clock },
  missed: { label: "Missed", badge: "destructive", icon: AlertTriangle },
  upcoming: { label: "Upcoming", badge: "secondary", icon: Circle },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

interface ApplicationData {
  application: SolarApplication;
  package: SolarPackage | null;
  plan: Plan | null;
  periods: PlanPeriod[] | null;
}

export default function SolarPaymentHistoryPage() {
  const user = useUserStore((s) => s.user);
  const settings = useBankSettings();
  const [data, setData] = useState<ApplicationData | null | undefined>(undefined);

  useEffect(() => {
    if (!user) return;
    api
      .get<ApplicationData>("/api/solar/application")
      .then((d) => setData(d.application ? d : null))
      .catch(() => setData(null));
  }, [user]);

  if (!user) {
    return (
      <AuthRequired
        title="Log in to see your solar payment history"
        description="Sign in to track your registration fee, deposit and repayment schedule."
      />
    );
  }

  if (data === undefined) {
    return (
      <div className="py-16 sm:py-20">
        <Container className="max-w-md text-center text-body-sm text-muted-foreground">Loading…</Container>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-16 sm:py-20">
        <Container className="max-w-md text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
            <Sun className="size-7 text-primary" />
          </div>
          <h1 className="text-h2 font-bold mb-2">No solar application yet</h1>
          <p className="text-body-sm text-muted-foreground mb-6">Apply for a Solar Plan to see your payment history here.</p>
          <Link href="/solar" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
            View Solar Packages <ArrowRight className="size-4" />
          </Link>
        </Container>
      </div>
    );
  }

  const { application: app, package: pkg, plan, periods } = data;
  const freqMeta = SOLO_FREQUENCIES[app.chosenFrequency];

  const oneOffPayments = [
    { label: "Registration fee", amount: pkg?.registrationFee ?? 0, date: app.registrationFeePaidAt, note: "Non-refundable" },
    ...(app.depositPaidAt ? [{ label: "Initial deposit", amount: pkg?.initialDeposit ?? 0, date: app.depositPaidAt, note: null }] : []),
  ];

  const duePeriod = periods?.find((p) => p.status === "due" || p.status === "missed");

  return (
    <div className="py-8 sm:py-12">
      <Container className="max-w-2xl">
        <Link href="/solar/application" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6 gap-2")}>
          <ArrowLeft className="size-4" /> My Application
        </Link>

        <h1 className="text-h1 font-bold mb-1">Payment history</h1>
        <p className="text-body-sm text-muted-foreground mb-6 font-mono">{app.reference}</p>

        {/* One-off payments */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-body font-semibold">Registration &amp; deposit</h2>
          </div>
          <div className="divide-y divide-border">
            {oneOffPayments.map((p) => (
              <div key={p.label} className="flex items-center gap-3 px-5 py-3.5">
                <CheckCircle2 className="size-4 text-success flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-medium">{p.label}</p>
                  <p className="text-micro text-muted-foreground">{formatDate(p.date)}{p.note ? ` · ${p.note}` : ""}</p>
                </div>
                <span className="text-body-sm font-semibold text-primary">{naira(p.amount)}</span>
                <Badge variant="success" className="text-micro">Confirmed</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Balance repayment schedule */}
        {periods && periods.length > 0 && plan ? (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-body font-semibold">Balance repayment</h2>
              <span className="text-caption text-muted-foreground">{naira(plan.perPayment)}{freqMeta.per}</span>
            </div>
            <div className="divide-y divide-border">
              {periods.map((period) => {
                const meta = PERIOD_META[period.status];
                const Icon = meta.icon;
                return (
                  <div key={period.index} className="flex items-center gap-3 px-5 py-3">
                    <Icon
                      className={cn(
                        "size-4 flex-shrink-0",
                        period.status === "paid" && "text-success",
                        period.status === "missed" && "text-destructive",
                        period.status === "due" && "text-primary",
                        period.status === "upcoming" && "text-muted-foreground",
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium capitalize">
                        {freqMeta.unit} {period.index} <span className="text-muted-foreground font-normal">· due {formatDate(period.dueDate)}</span>
                      </p>
                    </div>
                    <span className="text-body-sm font-semibold">{naira(period.amount)}</span>
                    <Badge variant={meta.badge} className="text-micro flex-shrink-0">{meta.label}</Badge>
                  </div>
                );
              })}
            </div>
            {duePeriod && (
              <div className="border-t border-border p-4">
                <a
                  href={waHref(
                    settings?.whatsappNumber,
                    `Hi OCare Phinas! I just paid ${naira(duePeriod.amount)} for my Solar Plan (${app.reference}). Please find my screenshot attached.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#1eb85a] text-white font-semibold text-body-sm px-4 py-2.5 transition-colors"
                >
                  <MessageCircle className="size-4" /> Pay {naira(duePeriod.amount)} now
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-body-sm text-muted-foreground">
            {app.status === "completed"
              ? "Balance fully repaid."
              : "Your repayment schedule starts once installation is complete."}
          </div>
        )}
      </Container>
    </div>
  );
}
