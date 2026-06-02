/* ------------------------------------------------------------------ *
 * WhatsApp helpers                                                     *
 * ------------------------------------------------------------------ *
 * Payment is a manual bank transfer; customers send their transfer     *
 * screenshot on WhatsApp. The business number is where proofs land;    *
 * a customer's own number is used for follow-up. The system never      *
 * stores bank / sender / transaction details — verification is visual. *
 * ------------------------------------------------------------------ */

/** The store's WhatsApp number that receives payment screenshots. Phase 3: from settings. */
export const BUSINESS_WHATSAPP = "2340000000000";

/** Normalise a Nigerian number (080…, +234…, 234…) to wa.me digits (234…). */
export function waNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  return digits;
}

/** Build a wa.me deep link with a prefilled message. */
export function waLink(phone: string, message: string): string {
  return `https://wa.me/${waNumber(phone)}?text=${encodeURIComponent(message)}`;
}
