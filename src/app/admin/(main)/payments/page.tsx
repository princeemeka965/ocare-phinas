import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, ChevronRight, MessageCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { MOCK_PAYMENTS, PAYMENT_STATUS_META } from "@/lib/payments";

export const metadata: Metadata = { title: "Payments Queue — OCare Phinas Admin" };

export default function PaymentsQueuePage() {
  const pending = MOCK_PAYMENTS.filter((p) => p.status === "awaiting");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 font-bold">Payments Queue</h1>
        <p className="text-muted-foreground mt-1">Customers pay by manual bank transfer and send a screenshot on WhatsApp. Open a payment to verify the screenshot against your statement, then confirm or reject. Confirming decrements stock atomically — this is the only place stock changes for orders.</p>
      </div>

      {pending.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-16 text-center">
          <CheckCircle className="size-12 text-success mx-auto mb-3 opacity-50" />
          <p className="text-h3 font-semibold">All clear</p>
          <p className="text-body-sm text-muted-foreground mt-1">No payments are awaiting confirmation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((payment) => {
            const meta = PAYMENT_STATUS_META[payment.status];
            return (
              <Link
                key={payment.id}
                href={`/admin/payments/${payment.id}`}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-md transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-body font-bold font-mono">{payment.orderRef}</span>
                    <Badge variant={meta.variant} className="text-micro">{meta.label}</Badge>
                  </div>
                  <p className="text-body-sm text-muted-foreground">{payment.customer.name} · submitted {payment.submittedAt}</p>
                  <p className="text-caption text-muted-foreground flex items-center gap-1.5 mt-1">
                    <MessageCircle className="size-3.5 text-[#25D366]" /> Screenshot sent on WhatsApp — verify before confirming
                  </p>
                </div>
                <p className="text-h3 font-bold text-primary flex-shrink-0">₦{payment.amount.toLocaleString("en-NG")}</p>
                <ChevronRight className="size-5 text-muted-foreground/50 group-hover:text-muted-foreground flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
