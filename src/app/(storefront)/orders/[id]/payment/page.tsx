"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy, Check } from "lucide-react";

import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import { toast } from "@/store/toastStore";
import { useUserStore } from "@/store/userStore";
import { AuthRequired } from "@/components/storefront/auth-required";

interface Order {
  id: string;
  reference: string;
  total: number;
  status: string;
}

interface PublicSettings {
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  whatsappNumber: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PaymentInstructionsPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const [order, setOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.get<{ order: Order }>(`/api/orders/${id}`).then((d) => setOrder(d.order)).catch(() => {});
    api.get<{ settings: PublicSettings }>("/api/settings").then((d) => setSettings(d.settings)).catch(() => {});
  }, [id, user]);

  if (!user) {
    return (
      <AuthRequired
        title="Log in to complete payment"
        description="Sign in to see your transfer details and confirm your order."
      />
    );
  }

  if (!order || !settings) {
    return (
      <div className="py-8 sm:py-12">
        <Container className="max-w-lg lg:max-w-2xl">
          <div className="h-8 w-40 rounded bg-muted animate-pulse mb-8" />
          <div className="h-64 rounded-2xl border border-border bg-card animate-pulse" />
        </Container>
      </div>
    );
  }

  const amount = order.total;
  const reference = order.reference;
  const alreadySubmitted = order.status !== "pending_payment";
  const waMessage = encodeURIComponent(
    `Hi OCare Phinas! I just transferred ₦${amount.toLocaleString("en-NG")} for order ${reference}. Please find my screenshot attached.`,
  );

  async function markPaid() {
    setSubmitting(true);
    try {
      await api.post(`/api/orders/${id}/submit-payment`);
      toast.success("Thanks! We'll confirm your transfer shortly.");
      router.push(`/orders/${id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't update your order. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="py-8 sm:py-12">
      <Container className="max-w-lg lg:max-w-2xl">
        <Link href={`/orders/${id}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6 gap-2")}>
          <ArrowLeft className="size-4" /> Back to order
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-h1 font-bold mb-2">Payment Instructions</h1>
          <p className="text-body-sm text-muted-foreground">
            Transfer the exact amount below, then send your screenshot on WhatsApp.
          </p>
        </div>

        {/* Bank details card */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 space-y-5 mb-6">
          <div>
            <p className="text-caption font-semibold text-primary uppercase tracking-widest mb-3">
              Bank Transfer Details
            </p>
            <div className="space-y-3">
              <DetailRow label="Bank" value={settings.bankName || "—"} />
              <DetailRow label="Account name" value={settings.bankAccountName || "—"} />
              <DetailRow label="Account number" value={settings.bankAccountNumber || "—"} copyable />
              <DetailRow label="Amount" value={`₦${amount.toLocaleString("en-NG")}`} highlight />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background/80 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-caption font-semibold mb-0.5">Order reference / narration</p>
                <p className="text-body font-bold font-mono tracking-wider">{reference}</p>
                <p className="text-caption text-muted-foreground mt-1">
                  Include this in the transfer narration/remark so we can match your payment instantly.
                </p>
              </div>
              <CopyButton value={reference} label="Copy order reference" />
            </div>
          </div>
        </div>

        {/* Primary CTA — mark paid + WhatsApp */}
        <button
          onClick={markPaid}
          disabled={submitting || alreadySubmitted}
          className="mx-auto flex w-full max-w-md flex-col items-center justify-center rounded-xl bg-[#25D366] hover:bg-[#1eb85a] disabled:opacity-60 text-white font-semibold text-body-sm sm:text-body px-5 sm:px-6 py-3.5 transition-colors mb-3 text-center"
        >
          <span>{alreadySubmitted ? "Payment marked — awaiting confirmation" : submitting ? "Saving…" : "I've made the bank transfer"}</span>
          {!alreadySubmitted && (
            <span className="text-caption font-normal opacity-90">
              We&apos;ll mark this order as paid and confirm your transfer
            </span>
          )}
        </button>

        <a
          href={`https://wa.me/${settings.whatsappNumber || "2340000000000"}?text=${waMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-auto flex w-full max-w-md items-center justify-center rounded-xl border border-[#25D366] text-[#1eb85a] hover:bg-[#25D366]/5 font-semibold text-body-sm px-5 py-3 transition-colors mb-3 text-center"
        >
          Send my receipt on WhatsApp
        </a>

        <p className="text-center text-caption text-muted-foreground mb-6">
          This opens WhatsApp with your order details pre-filled. Just attach your transfer screenshot and send.
        </p>

        <div className="mt-8 rounded-xl border border-border bg-muted/50 p-4">
          <p className="text-caption text-muted-foreground text-center">
            We confirm transfers manually, usually within 2 hours on business days. You&apos;ll receive confirmation via WhatsApp.
          </p>
        </div>
      </Container>
    </div>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-caption font-medium flex-shrink-0"
      aria-label={label}
    >
      {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />} {copied ? "Copied" : "Copy"}
    </button>
  );
}

function DetailRow({
  label,
  value,
  copyable,
  highlight,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-body-sm text-muted-foreground flex-shrink-0">{label}</span>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "text-body-sm font-semibold",
            highlight && "text-body font-bold text-primary",
          )}
        >
          {value}
        </span>
        {copyable && <CopyButton value={value} label={`Copy ${label}`} />}
      </div>
    </div>
  );
}
