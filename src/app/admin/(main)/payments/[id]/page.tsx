import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, MessageCircle, Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getPayment, PAYMENT_STATUS_META } from "@/lib/payments";
import { getOrder } from "@/lib/orders";
import { waLink } from "@/lib/whatsapp";
import { DecisionActions } from "@/components/admin/decision-actions";

export const metadata: Metadata = { title: "Payment — OCare Phinas Admin" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PaymentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const payment = getPayment(id);
  if (!payment) notFound();

  const order = getOrder(payment.orderId);
  const meta = PAYMENT_STATUS_META[payment.status];

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/admin/payments" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2 -ml-2")}>
        <ArrowLeft className="size-4" /> Payments queue
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-h2 font-bold font-mono">{payment.orderRef}</h1>
            <Badge variant={meta.variant} className="text-body-sm px-3 py-1">{meta.label}</Badge>
          </div>
          <p className="text-caption text-muted-foreground">Submitted {payment.submittedAt}</p>
        </div>
        <p className="text-h2 font-bold text-primary">₦{payment.amount.toLocaleString("en-NG")}</p>
      </div>

      {/* Verification notice */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-body font-semibold">Verify this payment</h2>
        <p className="text-body-sm text-muted-foreground">
          This was a manual bank transfer. The system does not capture the bank, sender name or transaction reference —
          {" "}the customer sends a screenshot on WhatsApp. Confirm the screenshot matches a real credit on your bank
          statement for <span className="font-semibold text-foreground">₦{payment.amount.toLocaleString("en-NG")}</span> before confirming.
        </p>

        <div className="rounded-xl border border-border bg-muted/40 divide-y divide-border text-body-sm">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-muted-foreground">Customer</span>
            <span className="font-semibold">{payment.customer.name}</span>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-muted-foreground">Phone</span>
            <span className="font-medium flex items-center gap-1.5"><Phone className="size-3.5" /> {payment.customer.phone}</span>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-muted-foreground">Expected amount</span>
            <span className="font-bold text-primary">₦{payment.amount.toLocaleString("en-NG")}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={waLink(payment.customer.phone, `Hi ${payment.customer.name}, regarding your OCare Phinas payment for order ${payment.orderRef}…`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#1eb85a] text-white font-semibold text-body-sm px-4 py-2.5 transition-colors"
          >
            <MessageCircle className="size-4" /> Open WhatsApp chat
          </a>
          {order && (
            <Link href={`/admin/orders/${order.id}`} className={cn(buttonVariants({ variant: "outline" }), "gap-2")}>
              <ExternalLink className="size-4" /> View full order
            </Link>
          )}
        </div>
      </div>

      {/* Decision */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-body font-semibold">Decision</h2>
        <DecisionActions
          reference={payment.orderRef}
          initialStatus={payment.status}
          confirmLabel="Confirm payment"
          rejectLabel="Reject"
          confirmToast={`${payment.orderRef} confirmed — order marked confirmed and stock decremented.`}
          rejectToast={`${payment.orderRef} payment rejected.`}
          note="Confirming marks the order confirmed and decrements stock atomically. Only confirm once you've seen the funds."
        />
      </div>
    </div>
  );
}
