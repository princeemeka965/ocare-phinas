import type { Metadata } from "next";
import { CheckCircle, XCircle, Eye } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Payments Queue — OCare Phinas Admin" };

const PENDING = [
  { id: "1", ref: "OCP-2026-00051", customer: "Adaeze Okonkwo", amount: 65990, bank: "GTBank", senderName: "ADAEZE C OKONKWO", txRef: "FBN2026051200001", submittedAt: "2026-05-29 10:14", hasScreenshot: true },
  { id: "2", ref: "OCP-2026-00050", customer: "Emeka Nwosu", amount: 22990, bank: "Access Bank", senderName: "EMEKA JOHN NWOSU", txRef: "ACB2026051100089", submittedAt: "2026-05-29 08:02", hasScreenshot: true },
  { id: "3", ref: "OCP-2026-00049", customer: "Bola Adesanya", amount: 18900, bank: "Zenith", senderName: "ADESANYA BOLA M", txRef: "", submittedAt: "2026-05-28 19:55", hasScreenshot: false },
];

export default function PaymentsQueuePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 font-bold">Payments Queue</h1>
        <p className="text-muted-foreground mt-1">Confirm or reject customer payment submissions. Confirming a payment decrements stock atomically — this is the only place stock changes for orders.</p>
      </div>

      {PENDING.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-16 text-center">
          <CheckCircle className="size-12 text-success mx-auto mb-3 opacity-50" />
          <p className="text-h3 font-semibold">All clear</p>
          <p className="text-body-sm text-muted-foreground mt-1">No payments are awaiting confirmation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {PENDING.map((payment) => (
            <div key={payment.id} className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-body font-bold font-mono">{payment.ref}</span>
                    <Badge variant="warning" className="text-micro">Awaiting confirmation</Badge>
                  </div>
                  <p className="text-body-sm text-muted-foreground">{payment.customer} · {payment.submittedAt}</p>
                </div>
                <p className="text-h3 font-bold text-primary">₦{payment.amount.toLocaleString("en-NG")}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-body-sm">
                <div><p className="text-caption text-muted-foreground mb-0.5">Bank</p><p className="font-medium">{payment.bank}</p></div>
                <div><p className="text-caption text-muted-foreground mb-0.5">Sender name</p><p className="font-medium">{payment.senderName}</p></div>
                <div><p className="text-caption text-muted-foreground mb-0.5">Transaction ref</p><p className="font-mono font-medium">{payment.txRef || <span className="text-muted-foreground italic">Not provided</span>}</p></div>
                <div>
                  <p className="text-caption text-muted-foreground mb-0.5">Proof</p>
                  {payment.hasScreenshot ? (
                    <button className="flex items-center gap-1.5 text-primary font-medium hover:underline"><Eye className="size-3.5" /> View screenshot</button>
                  ) : (
                    <span className="text-muted-foreground italic text-caption">WhatsApp only — check chat</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success text-white font-semibold text-body-sm hover:bg-success/90 transition-colors">
                  <CheckCircle className="size-4" /> Confirm payment
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-destructive/30 text-destructive font-semibold text-body-sm hover:bg-destructive/10 transition-colors">
                  <XCircle className="size-4" /> Reject
                </button>
                <p className="text-caption text-muted-foreground ml-auto hidden sm:block">Confirming will mark the order confirmed and decrement stock.</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
