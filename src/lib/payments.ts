/* ------------------------------------------------------------------ *
 * Payments queue — manual order-payment confirmations                  *
 * ------------------------------------------------------------------ *
 * A customer pays by manual bank transfer and sends a screenshot on    *
 * WhatsApp, then marks the order paid. The system records only WHO,    *
 * HOW MUCH and WHEN — never the bank, sender name or transaction ref.  *
 * Admins verify the WhatsApp screenshot against the bank statement,    *
 * then confirm (which decrements stock) or reject.                     *
 * Phase 3: replace with a real DB fetch.                               *
 * ------------------------------------------------------------------ */

export type PaymentStatus = "awaiting" | "confirmed" | "rejected";

export interface Payment {
  id: string;
  orderId: string;
  orderRef: string;
  customer: { name: string; phone: string };
  amount: number;
  submittedAt: string;
  status: PaymentStatus;
}

export const PAYMENT_STATUS_META: Record<PaymentStatus, { label: string; variant: "warning" | "success" | "destructive" }> = {
  awaiting: { label: "Awaiting confirmation", variant: "warning" },
  confirmed: { label: "Confirmed", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
};

export const MOCK_PAYMENTS: Payment[] = [
  { id: "1", orderId: "1", orderRef: "OCP-2026-00051", customer: { name: "Adaeze Okonkwo", phone: "08011234567" }, amount: 65990, submittedAt: "2026-05-29 10:14", status: "awaiting" },
  { id: "2", orderId: "2", orderRef: "OCP-2026-00050", customer: { name: "Emeka Nwosu", phone: "08022345678" }, amount: 22990, submittedAt: "2026-05-29 08:02", status: "awaiting" },
  { id: "3", orderId: "3", orderRef: "OCP-2026-00049", customer: { name: "Bola Adesanya", phone: "08033456789" }, amount: 18900, submittedAt: "2026-05-28 19:55", status: "awaiting" },
];

export function getPayment(id: string): Payment | undefined {
  return MOCK_PAYMENTS.find((p) => p.id === id);
}
