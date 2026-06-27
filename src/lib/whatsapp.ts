/* ------------------------------------------------------------------ *
 * WhatsApp helpers                                                     *
 * ------------------------------------------------------------------ *
 * Payment is a manual bank transfer; customers send their transfer     *
 * screenshot on WhatsApp. The business number is where proofs land;    *
 * a customer's own number is used for follow-up. The system never      *
 * stores bank / sender / transaction details — verification is visual. *
 * ------------------------------------------------------------------ */

/**
 * Fallback wa.me digits used ONLY when admin Settings has no WhatsApp number
 * configured yet. The real number always comes from Settings.whatsappNumber.
 */
export const BUSINESS_WHATSAPP = "2340000000000";

/** Normalise a Nigerian number (080…, +234…, 234…) to wa.me digits (234…). */
export function waNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  return digits;
}

/** wa.me digits for a configured number, falling back to BUSINESS_WHATSAPP when unset. */
export function waNumberOr(phone?: string | null): string {
  const v = (phone ?? "").trim();
  return v ? waNumber(v) : BUSINESS_WHATSAPP;
}

/** Build a wa.me deep link with a prefilled message. */
export function waLink(phone: string, message: string): string {
  return `https://wa.me/${waNumber(phone)}?text=${encodeURIComponent(message)}`;
}

/** A wa.me deep link for a configured number, with an optional prefilled message. */
export function waHref(phone?: string | null, message?: string): string {
  const url = `https://wa.me/${waNumberOr(phone)}`;
  return message ? `${url}?text=${encodeURIComponent(message)}` : url;
}

/** A `tel:` href (E.164, with +) for a configured number. */
export function telHref(phone?: string | null): string {
  return `tel:+${waNumberOr(phone)}`;
}

/** Human-readable phone for display, e.g. "+2348012345678". */
export function formatPhoneDisplay(phone?: string | null): string {
  const v = (phone ?? "").trim();
  if (!v) return "+234 000 000 0000";
  return v.startsWith("+") ? v : `+${waNumberOr(v)}`;
}
