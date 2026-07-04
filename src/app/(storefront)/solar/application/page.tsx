"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sun,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  XCircle,
  RotateCcw,
  Wrench,
  CalendarClock,
  AlertTriangle,
  Receipt,
} from "lucide-react";

import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toastStore";
import { useUserStore } from "@/store/userStore";
import { useSolarStore } from "@/store/solarStore";
import { useBankSettings } from "@/hooks/useBankSettings";
import { AuthRequired } from "@/components/storefront/auth-required";
import { BankTransferCard } from "@/components/storefront/bank-transfer-card";
import { naira, SOLO_FREQUENCIES } from "@/lib/pay-small-small";
import { waHref } from "@/lib/whatsapp";
import { paymentHealth, planPeriods, HEALTH_META, isArrears } from "@/lib/payment-health";
import {
  SOLAR_STATUS_FLOW,
  SOLAR_STATUS_META,
  cadenceFor,
  packageBalance,
  type SolarApplication,
  type SolarApplicationStatus,
  type SolarPackage,
} from "@/lib/solar";

const FLOW_LABELS: Record<SolarApplicationStatus, string> = {
  under_review: "Under review",
  not_approved: "Not approved",
  approved_awaiting_deposit: "Awaiting deposit",
  installation_processing: "Processing",
  installation_scheduled: "Scheduled",
  active_repayment: "Repaying",
  completed: "Completed",
  defaulted: "Defaulted",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
}

export default function MySolarApplicationPage() {
  const user = useUserStore((s) => s.user);
  const applications = useSolarStore((s) => s.applications);
  const packages = useSolarStore((s) => s.packages);
  const submitDepositPayment = useSolarStore((s) => s.submitDepositPayment);
  const reapply = useSolarStore((s) => s.reapply);
  const settings = useBankSettings();

  const [submittingDeposit, setSubmittingDeposit] = useState(false);

  if (!user) {
    return (
      <AuthRequired
        title="Log in to track your solar application"
        description="Sign in to see your application status, pay your deposit and track installation."
      />
    );
  }

  const app = applications.find((a) => a.customerId === user.id);

  if (!app) {
    return (
      <div className="py-16 sm:py-20">
        <Container className="max-w-md text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
            <Sun className="size-7 text-primary" />
          </div>
          <h1 className="text-h2 font-bold mb-2">No solar application yet</h1>
          <p className="text-body-sm text-muted-foreground mb-6">
            You haven&apos;t applied for a Solar Plan. Take a look at the available packages to get started.
          </p>
          <Link href="/solar" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
            View Solar Packages <ArrowRight className="size-4" />
          </Link>
        </Container>
      </div>
    );
  }

  const pkg = packages.find((p) => p.id === app.packageId);
  const meta = SOLAR_STATUS_META[app.status];
  const flowIdx = SOLAR_STATUS_FLOW.indexOf(app.status);

  function sendDepositPayment() {
    setSubmittingDeposit(true);
    submitDepositPayment(app!.id);
    toast.success("Thanks — we'll confirm your deposit once we see it on our statement.", "Deposit submitted");
    setSubmittingDeposit(false);
  }

  function handleReapply() {
    reapply(app!.id);
    toast.success("Application resubmitted — back under review.", "Re-applied");
  }

  return (
    <div className="py-8 sm:py-12">
      <Container className="max-w-2xl">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-h1 font-bold font-mono">{app.reference}</h1>
              <Badge variant={meta.badge} className="text-micro">{meta.label}</Badge>
            </div>
            <p className="text-caption text-muted-foreground mt-1">{pkg?.name ?? "Solar Plan"} · applied {formatDate(app.createdAt)}</p>
          </div>
          <Link href="/solar/payments" className="inline-flex items-center gap-1.5 text-body-sm font-medium text-primary hover:underline">
            <Receipt className="size-4" /> Payment history
          </Link>
        </div>

        {/* Not approved — rejection + re-apply */}
        {app.status === "not_approved" && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 mb-6">
            <div className="flex items-start gap-3">
              <XCircle className="size-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-body-sm font-semibold">Application not approved</p>
                <p className="text-body-sm text-muted-foreground mt-1">
                  {app.rejectionReason || "Your application didn't pass verification."}
                </p>
                <button
                  onClick={handleReapply}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary text-white text-body-sm font-semibold px-3 py-2 hover:bg-primary/90 transition-colors"
                >
                  <RotateCcw className="size-4" /> Re-apply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Defaulted notice */}
        {app.status === "defaulted" && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 mb-6 flex items-start gap-3">
            <AlertTriangle className="size-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-body-sm text-muted-foreground">
              This plan has defaulted after an extended lapse in repayment. This may affect your eligibility for
              future Solar Plans — your other purchases and plans are unaffected.
            </p>
          </div>
        )}

        {/* Status timeline — main flow only */}
        {app.status !== "not_approved" && (
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 mb-6">
            <ol className="space-y-0">
              {SOLAR_STATUS_FLOW.map((s, i) => {
                const done = flowIdx >= 0 && i <= flowIdx;
                const current = s === app.status;
                const last = i === SOLAR_STATUS_FLOW.length - 1;
                return (
                  <li key={s} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "flex size-8 items-center justify-center rounded-full border-2 transition-colors",
                          done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground",
                        )}
                      >
                        {done ? (current ? <Clock className="size-4" /> : <CheckCircle2 className="size-4" />) : <Circle className="size-4" />}
                      </div>
                      {!last && <div className={cn("w-0.5 flex-1 min-h-[1.5rem] my-1", i < flowIdx ? "bg-primary" : "bg-border")} />}
                    </div>
                    <div className={cn("pb-5", last && "pb-0")}>
                      <p className={cn("text-body-sm font-medium leading-tight pt-1", done ? "text-foreground" : "text-muted-foreground")}>
                        {FLOW_LABELS[s]}
                      </p>
                      {current && <p className="text-caption text-muted-foreground mt-0.5">{meta.description}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {/* Pay deposit */}
        {app.status === "approved_awaiting_deposit" && pkg && (
          <div className="mb-6">
            <h2 className="text-body font-semibold mb-3">Initial deposit</h2>
            {app.depositSubmittedAt ? (
              <div className="rounded-2xl border border-warning/40 bg-warning/10 p-5 flex items-start gap-3">
                <Clock className="size-5 text-foreground flex-shrink-0 mt-0.5" />
                <p className="text-body-sm text-muted-foreground">
                  We&apos;ve recorded that you sent {naira(pkg.initialDeposit)} — awaiting confirmation on our
                  bank statement. Installation scheduling begins once it&apos;s confirmed.
                </p>
              </div>
            ) : (
              <BankTransferCard
                amount={pkg.initialDeposit}
                narration={app.reference}
                settings={settings}
                waMessage={`Hi OCare Phinas! I just paid ${naira(pkg.initialDeposit)} deposit for my Solar Plan (${app.reference}). Please find my screenshot attached.`}
                confirmLabel="I've sent the deposit"
                confirming={submittingDeposit}
                onConfirm={sendDepositPayment}
              />
            )}
          </div>
        )}

        {/* Installation processing / scheduled */}
        {(app.status === "installation_processing" || app.status === "installation_scheduled") && (
          <div className="rounded-2xl border border-border bg-card p-5 mb-6 flex items-start gap-3">
            <Wrench className="size-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              {app.status === "installation_processing" ? (
                <p className="text-body-sm text-muted-foreground">
                  Deposit confirmed — we&apos;re arranging your installation date. We&apos;ll notify you once it&apos;s scheduled.
                </p>
              ) : (
                <p className="text-body-sm text-muted-foreground">
                  Installation scheduled for{" "}
                  <strong className="text-foreground">
                    {app.installation.scheduledDate ? formatDate(app.installation.scheduledDate) : "—"} at {app.installation.scheduledTime}
                  </strong>
                  .
                </p>
              )}
              <Link href="/solar/installation" className="inline-flex items-center gap-1 text-caption font-medium text-primary hover:underline mt-2">
                View installation status <ArrowRight className="size-3" />
              </Link>
            </div>
          </div>
        )}

        {/* Repayment summary */}
        {(app.status === "active_repayment" || app.status === "completed" || app.status === "defaulted") && pkg && (
          <RepaymentSummary app={app} pkg={pkg} whatsappNumber={settings?.whatsappNumber} />
        )}
      </Container>
    </div>
  );
}

function RepaymentSummary({
  app,
  pkg,
  whatsappNumber,
}: {
  app: SolarApplication;
  pkg: SolarPackage;
  whatsappNumber?: string;
}) {
  const cadence = cadenceFor(pkg, app.chosenFrequency);
  const balance = packageBalance(pkg);
  const startDate = app.activeRepaymentStartDate ?? app.createdAt;
  const periods = planPeriods({
    price: balance,
    perPayment: cadence.amount,
    frequency: app.chosenFrequency,
    startDate,
    paidIndices: app.paidPeriodIndices,
  });
  const amountPaid = periods.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const health = paymentHealth({
    price: balance,
    amountPaid,
    perPayment: cadence.amount,
    frequency: app.chosenFrequency,
    startDate,
  });
  const freqMeta = SOLO_FREQUENCIES[app.chosenFrequency];
  const arrears = isArrears(health.status);
  const waMessage = `Hi OCare Phinas! I just paid ${naira(cadence.amount)} for my Solar Plan (${app.reference}). Please find my screenshot attached.`;

  return (
    <div>
      <h2 className="text-body font-semibold mb-3">Repayment</h2>
      <div className={cn("rounded-2xl border bg-card p-5", arrears && (health.status === "overdue" ? "border-destructive/40" : "border-warning/50"))}>
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Badge variant={app.status === "completed" ? "secondary" : "default"} className="text-micro">
            {app.status === "completed" ? "Fully paid" : `${naira(cadence.amount)}${freqMeta.per}`}
          </Badge>
          {arrears && (
            <Badge variant={HEALTH_META[health.status].badge} className="text-micro gap-1">
              <AlertTriangle className="size-3" /> {HEALTH_META[health.status].label}
            </Badge>
          )}
        </div>

        <div className="relative h-2 rounded-full bg-muted overflow-hidden mb-1.5">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, (amountPaid / balance) * 100)}%`, background: "linear-gradient(90deg, oklch(0.55 0.15 150), oklch(0.72 0.17 78))" }}
          />
        </div>
        <div className="flex justify-between text-micro text-muted-foreground mb-4">
          <span>{naira(amountPaid)} of {naira(balance)}</span>
          <span>{Math.min(100, (amountPaid / balance) * 100).toFixed(0)}%</span>
        </div>

        {app.status !== "completed" && (
          <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
            <p className="text-caption text-muted-foreground flex items-center gap-1.5">
              <CalendarClock className="size-3.5" />
              {arrears
                ? `${naira(health.arrears)} ${health.status === "overdue" ? "overdue" : "behind"}`
                : `Next due ${formatDate(health.nextDueDate)}`}
            </p>
            <a
              href={waHref(whatsappNumber, waMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg text-white font-semibold text-caption px-3 py-2 transition-colors",
                arrears && health.status === "overdue" ? "bg-destructive hover:bg-destructive/90" : "bg-[#25D366] hover:bg-[#1eb85a]",
              )}
            >
              Pay {naira(arrears ? health.arrears : cadence.amount)} now
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
