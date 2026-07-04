"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sun,
  Mail,
  Phone,
  MapPin,
  FileText,
  Briefcase,
  UserCog,
  CheckCircle2,
  XCircle,
  Clock,
  Circle,
  AlertTriangle,
  Wrench,
  CalendarClock,
  MessageCircle,
  Lock,
  ShieldAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toastStore";
import { useAdminStore } from "@/store/adminStore";
import { useSolarStore } from "@/store/solarStore";
import { naira, SOLO_FREQUENCIES } from "@/lib/pay-small-small";
import { waLink } from "@/lib/whatsapp";
import { planPeriods, paymentHealth, HEALTH_META, isArrears, type PlanPeriodStatus } from "@/lib/payment-health";
import { SOLAR_ID_TYPES, SOLAR_STATUS_META, cadenceFor, packageBalance } from "@/lib/solar";

interface PageProps {
  params: Promise<{ id: string }>;
}

const PERIOD_META: Record<PlanPeriodStatus, { label: string; badge: "success" | "warning" | "destructive" | "secondary" | "default"; icon: typeof Circle }> = {
  paid: { label: "Paid", badge: "success", icon: CheckCircle2 },
  due: { label: "Due now", badge: "default", icon: Clock },
  missed: { label: "Missed", badge: "destructive", icon: AlertTriangle },
  upcoming: { label: "Upcoming", badge: "secondary", icon: Circle },
};

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminSolarApplicationDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const adminName = useAdminStore((s) => s.current?.name ?? "Admin");

  const app = useSolarStore((s) => s.applications.find((a) => a.id === id));
  const pkg = useSolarStore((s) => (app ? s.packages.find((p) => p.id === app.packageId) : undefined));

  const approveApplication = useSolarStore((s) => s.approveApplication);
  const rejectApplication = useSolarStore((s) => s.rejectApplication);
  const confirmDeposit = useSolarStore((s) => s.confirmDeposit);
  const rejectDeposit = useSolarStore((s) => s.rejectDeposit);
  const scheduleInstallation = useSolarStore((s) => s.scheduleInstallation);
  const completeInstallation = useSolarStore((s) => s.completeInstallation);
  const confirmBalancePayment = useSolarStore((s) => s.confirmBalancePayment);
  const markDefaulted = useSolarStore((s) => s.markDefaulted);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [confirmingPeriod, setConfirmingPeriod] = useState<number | null>(null);

  if (!app || !pkg) {
    return (
      <div className="max-w-3xl space-y-6">
        <Link href="/admin/solar" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2 -ml-2")}>
          <ArrowLeft className="size-4" /> Solar Applications
        </Link>
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <Sun className="size-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-body-sm text-muted-foreground">Application not found.</p>
        </div>
      </div>
    );
  }

  const meta = SOLAR_STATUS_META[app.status];
  const idTypeLabel = SOLAR_ID_TYPES.find((t) => t.value === app.idType)?.label ?? app.idType;
  const cadence = cadenceFor(pkg, app.chosenFrequency);
  const freqMeta = SOLO_FREQUENCIES[app.chosenFrequency];

  function approve() {
    approveApplication(app!.id, adminName);
    toast.success(`${app!.customerName} approved — awaiting deposit.`, "Application approved");
  }

  function reject() {
    if (!rejectReason.trim()) {
      toast.error("Add a reason so the customer knows why.", "Reason required");
      return;
    }
    rejectApplication(app!.id, adminName, rejectReason.trim());
    toast.info(`${app!.customerName}'s application rejected.`, "Application rejected");
    setRejectOpen(false);
    setRejectReason("");
  }

  function onConfirmDeposit() {
    confirmDeposit(app!.id);
    toast.success("Deposit confirmed — installation is now processing.", "Deposit confirmed");
  }

  function onRejectDeposit() {
    rejectDeposit(app!.id);
    toast.info("Deposit payment rejected — customer can resubmit.", "Deposit rejected");
  }

  function submitSchedule(e: React.FormEvent) {
    e.preventDefault();
    if (!scheduleDate || !scheduleTime) {
      toast.error("Pick a date and time.", "Missing details");
      return;
    }
    scheduleInstallation(app!.id, adminName, scheduleDate, scheduleTime, scheduleNotes.trim() || undefined);
    toast.success("Installation scheduled — customer notified.", "Scheduled");
  }

  function markComplete() {
    completeInstallation(app!.id);
    toast.success("Installation marked complete — repayment schedule has started.", "Installed");
  }

  function confirmPeriod(index: number) {
    setConfirmingPeriod(index);
    confirmBalancePayment(app!.id, index);
    toast.success(`${freqMeta.label} payment ${index} confirmed.`, "Payment confirmed");
    setConfirmingPeriod(null);
  }

  function onMarkDefaulted() {
    if (!confirm(`Mark ${app!.customerName}'s solar plan as defaulted? This flags future solar eligibility.`)) return;
    markDefaulted(app!.id);
    toast.info("Plan marked as defaulted.", "Defaulted");
  }

  const balance = packageBalance(pkg);
  const startDate = app.activeRepaymentStartDate;
  const periods = startDate
    ? planPeriods({ price: balance, perPayment: cadence.amount, frequency: app.chosenFrequency, startDate, paidIndices: app.paidPeriodIndices })
    : [];
  const amountPaid = periods.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const health = startDate
    ? paymentHealth({ price: balance, amountPaid, perPayment: cadence.amount, frequency: app.chosenFrequency, startDate })
    : null;

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/admin/solar" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2 -ml-2")}>
        <ArrowLeft className="size-4" /> Solar Applications
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-h2 font-bold font-mono">{app.reference}</h1>
            <Badge variant={meta.badge} className="text-micro gap-1"><Sun className="size-3" />{meta.label}</Badge>
          </div>
          <p className="text-caption text-muted-foreground mt-1">{pkg.name} · applied {fmt(app.createdAt)}</p>
        </div>
        <p className="text-h2 font-bold text-primary">{naira(pkg.totalAmount)}</p>
      </div>

      {/* Customer + KYC */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-body font-semibold mb-1">Customer</h2>
          <p className="font-semibold text-body-sm">{app.customerName}</p>
          <p className="flex items-center gap-2 text-body-sm text-muted-foreground"><Mail className="size-3.5 flex-shrink-0" /> {app.customerEmail}</p>
          <p className="flex items-center gap-2 text-body-sm text-muted-foreground"><Phone className="size-3.5 flex-shrink-0" /> {app.customerPhone || "—"}</p>
          <p className="flex items-start gap-2 text-body-sm text-muted-foreground"><MapPin className="size-3.5 flex-shrink-0 mt-0.5" /> {app.address}</p>
          {app.customerPhone && (
            <a
              href={waLink(app.customerPhone, `Hi ${app.customerName}, regarding your OCare Phinas solar application ${app.reference}…`)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#1eb85a] text-white font-semibold text-caption px-3 py-2 transition-colors"
            >
              <MessageCircle className="size-4" /> Message customer
            </a>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-body font-semibold mb-1">KYC &amp; documents</h2>
          <p className="flex items-center gap-2 text-body-sm text-muted-foreground"><UserCog className="size-3.5 flex-shrink-0" /> {idTypeLabel}</p>
          <p className="flex items-center gap-2 text-body-sm text-muted-foreground"><FileText className="size-3.5 flex-shrink-0" /> ID document: <span className="text-foreground font-medium">{app.idDocumentName ?? "—"}</span></p>
          <p className="flex items-center gap-2 text-body-sm text-muted-foreground"><FileText className="size-3.5 flex-shrink-0" /> Utility bill: <span className="text-foreground font-medium">{app.utilityBillName ?? "—"}</span></p>
          <p className="flex items-start gap-2 text-body-sm text-muted-foreground"><Briefcase className="size-3.5 flex-shrink-0 mt-0.5" /> {app.employmentDetails}</p>
          <p className="text-body-sm text-muted-foreground">Emergency contact: <span className="text-foreground font-medium">{app.emergencyContactName} ({app.emergencyContactPhone})</span></p>
        </div>
      </div>

      {/* Payment history */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-body font-semibold mb-3">Payment history</h2>
        <div className="space-y-2 text-body-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Registration fee ({fmt(app.registrationFeePaidAt)})</span><span className="font-semibold">{naira(pkg.registrationFee)}</span></div>
          {app.depositPaidAt && (
            <div className="flex justify-between"><span className="text-muted-foreground">Deposit confirmed ({fmt(app.depositPaidAt)})</span><span className="font-semibold">{naira(pkg.initialDeposit)}</span></div>
          )}
        </div>
      </div>

      {/* Review — approve / reject */}
      {app.status === "under_review" && (
        <div className="rounded-2xl border border-warning/30 bg-warning/5 p-5 space-y-3">
          <p className="text-body-sm font-semibold">Awaiting review</p>
          <p className="text-caption text-muted-foreground">
            Verify the documents and registration fee against your records, then approve or reject.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={approve} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-success text-white font-semibold text-body-sm hover:bg-success/90 transition-colors">
              <CheckCircle2 className="size-4" /> Approve
            </button>
            <button onClick={() => setRejectOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-destructive/30 text-destructive font-semibold text-body-sm hover:bg-destructive/10 transition-colors">
              <XCircle className="size-4" /> Reject
            </button>
          </div>
        </div>
      )}

      {app.status === "not_approved" && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
          <p className="text-body-sm font-semibold flex items-center gap-2"><XCircle className="size-4 text-destructive" /> Not approved</p>
          <p className="text-body-sm text-muted-foreground mt-1">{app.rejectionReason}</p>
          <p className="text-micro text-muted-foreground mt-2">By {app.reviewedBy} · {app.reviewedAt && fmt(app.reviewedAt)}</p>
        </div>
      )}

      {/* Deposit */}
      {app.status === "approved_awaiting_deposit" && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <p className="text-body-sm font-semibold">Initial deposit — {naira(pkg.initialDeposit)}</p>
          {!app.depositSubmittedAt ? (
            <div className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/40 px-4 py-3">
              <Lock className="size-4 text-muted-foreground flex-shrink-0" />
              <p className="text-body-sm text-muted-foreground">Awaiting the customer&apos;s deposit payment.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 space-y-3">
              <p className="text-caption text-muted-foreground">
                Customer says they sent this on {fmt(app.depositSubmittedAt)}. Confirm once you&apos;ve seen the funds.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={onConfirmDeposit} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-success text-white font-semibold text-body-sm hover:bg-success/90 transition-colors">
                  <CheckCircle2 className="size-4" /> Confirm deposit
                </button>
                <button onClick={onRejectDeposit} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-destructive/30 text-destructive font-semibold text-body-sm hover:bg-destructive/10 transition-colors">
                  <XCircle className="size-4" /> Reject
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Installation scheduling */}
      {app.status === "installation_processing" && (
        <form onSubmit={submitSchedule} className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <p className="text-body-sm font-semibold flex items-center gap-1.5"><Wrench className="size-4 text-primary" /> Schedule installation</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-body-sm font-medium block mb-1.5">Date</label>
              <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
            </div>
            <div>
              <label className="text-body-sm font-medium block mb-1.5">Time</label>
              <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-body-sm font-medium block mb-1.5">Notes (optional)</label>
            <Textarea rows={2} value={scheduleNotes} onChange={(e) => setScheduleNotes(e.target.value)} placeholder="e.g. access instructions, team assigned" />
          </div>
          <Button type="submit" className="gap-2"><CalendarClock className="size-4" /> Schedule installation</Button>
        </form>
      )}

      {/* Installation scheduled — mark complete */}
      {app.status === "installation_scheduled" && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <p className="text-body-sm font-semibold flex items-center gap-1.5"><CalendarClock className="size-4 text-primary" /> Installation scheduled</p>
          <p className="text-body-sm text-muted-foreground">
            {app.installation.scheduledDate && fmt(app.installation.scheduledDate)} at {app.installation.scheduledTime} · set by {app.installation.scheduledBy}
          </p>
          {app.installation.notes && <p className="text-caption text-muted-foreground">{app.installation.notes}</p>}
          <Button onClick={markComplete} className="gap-2"><CheckCircle2 className="size-4" /> Mark installation complete</Button>
        </div>
      )}

      {/* Repayment record */}
      {(app.status === "active_repayment" || app.status === "completed" || app.status === "defaulted") && health && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-body-sm font-semibold">Balance repayment — {naira(cadence.amount)}{freqMeta.per}</p>
            {isArrears(health.status) && (
              <Badge variant={HEALTH_META[health.status].badge} className="text-micro gap-1">
                <AlertTriangle className="size-3" /> {HEALTH_META[health.status].label}
              </Badge>
            )}
          </div>

          <div className="relative h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (amountPaid / balance) * 100)}%`, background: "linear-gradient(90deg, oklch(0.55 0.15 150), oklch(0.72 0.17 78))" }} />
          </div>
          <div className="flex justify-between text-micro text-muted-foreground">
            <span>{naira(amountPaid)} of {naira(balance)}</span>
            <span>{Math.min(100, (amountPaid / balance) * 100).toFixed(0)}%</span>
          </div>

          <div className="rounded-xl border border-border divide-y divide-border">
            {periods.map((period) => {
              const pm = PERIOD_META[period.status];
              const Icon = pm.icon;
              const canConfirm = period.status === "due" || period.status === "missed";
              return (
                <div key={period.index} className="flex items-center gap-3 px-4 py-2.5">
                  <Icon className={cn("size-4 flex-shrink-0", period.status === "paid" && "text-success", period.status === "missed" && "text-destructive", period.status === "due" && "text-primary", period.status === "upcoming" && "text-muted-foreground")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-medium capitalize">{freqMeta.unit} {period.index} <span className="text-muted-foreground font-normal">· due {fmt(period.dueDate)}</span></p>
                  </div>
                  <span className="text-body-sm font-semibold">{naira(period.amount)}</span>
                  {canConfirm ? (
                    <button onClick={() => confirmPeriod(period.index)} disabled={confirmingPeriod !== null} className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-accent text-white text-caption font-semibold px-2.5 py-1.5 ring-1 ring-accent/40 hover:bg-accent/90 transition-colors disabled:opacity-60">
                      <CheckCircle2 className="size-3.5" /> {confirmingPeriod === period.index ? "Confirming…" : "Confirm payment"}
                    </button>
                  ) : (
                    <Badge variant={pm.badge} className="text-micro flex-shrink-0">{pm.label}</Badge>
                  )}
                </div>
              );
            })}
          </div>

          {app.status === "active_repayment" && health.status === "overdue" && (
            <button onClick={onMarkDefaulted} className="inline-flex items-center gap-1.5 text-caption font-medium text-destructive hover:underline">
              <ShieldAlert className="size-3.5" /> Mark as defaulted
            </button>
          )}
          {app.status === "defaulted" && (
            <p className="text-caption text-destructive flex items-center gap-1.5"><ShieldAlert className="size-3.5" /> Defaulted — flags future solar eligibility.</p>
          )}
        </div>
      )}

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen} title="Reject application" description="The customer will see this reason.">
        <div className="space-y-4">
          <Textarea rows={4} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. Utility bill doesn't match the address provided." />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={reject}>Reject application</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
