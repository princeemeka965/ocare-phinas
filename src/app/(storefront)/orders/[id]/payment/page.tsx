import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Copy } from "lucide-react";

import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Payment Instructions — OCare Phinas" };

/* Bank details fetched live from Settings (B10) in Phase 3 */
const BANK = { name: "OCare Phinas Nigeria Ltd", number: "0123456789", bank: "GTBank" };
const WHATSAPP_NUMBER = "2340000000000";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PaymentInstructionsPage({ params }: PageProps) {
  const { id } = await params;
  /* Phase 3: fetch real order */
  const reference = "OCP-2026-00042";
  const amount = 68490;
  const waMessage = encodeURIComponent(
    `Hi OCare Phinas! I just transferred ₦${amount.toLocaleString("en-NG")} for order ${reference}. Please find my screenshot attached.`,
  );

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
              <DetailRow label="Bank" value={BANK.bank} />
              <DetailRow label="Account name" value={BANK.name} />
              <DetailRow label="Account number" value={BANK.number} copyable />
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
              <button
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-caption font-medium flex-shrink-0"
                aria-label="Copy order reference"
              >
                <Copy className="size-3.5" /> Copy
              </button>
            </div>
          </div>
        </div>

        {/* Primary CTA — WhatsApp */}
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-auto flex w-full max-w-md flex-col items-center justify-center rounded-xl bg-[#25D366] hover:bg-[#1eb85a] text-white font-semibold text-body-sm sm:text-body px-5 sm:px-6 py-3.5 transition-colors mb-3 text-center"
        >
          <span>I&apos;ve made the bank transfer</span>
          <span className="text-caption font-normal opacity-90">
            Tap to send your payment receipt on WhatsApp
          </span>
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
        {copyable && (
          <button
            className="flex items-center gap-1 px-2 py-0.5 rounded border border-border hover:bg-muted transition-colors text-caption"
            aria-label={`Copy ${label}`}
          >
            <Copy className="size-3" /> Copy
          </button>
        )}
      </div>
    </div>
  );
}
