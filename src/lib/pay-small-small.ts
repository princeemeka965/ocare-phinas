/* ------------------------------------------------------------------ *
 * Pay Small Small — the Slot Engine                                    *
 * ------------------------------------------------------------------ *
 * Single source of truth for the locked payment-flow rules.            *
 * See ocare-phinas-payment-flow.md (Sections 2–3, 11–12).              *
 *                                                                      *
 *   1 slot      = ₦1,000 per day                                       *
 *   1 cycle     = 50 days                                              *
 *   1 slot      = ₦50,000 per completed cycle  (₦1,000 × 50)           *
 *   slots       = ceil(price / 50,000)                                 *
 *   daily       = slots × ₦1,000                                       *
 *                                                                      *
 * The slot engine drives GROUP Plans only: a strict daily amount, no   *
 * paying ahead, no custom amounts. SOLO Plans do NOT use slots — the    *
 * customer chooses how AND when to pay: any amount, paid daily, weekly  *
 * or monthly (see SOLO_FREQUENCIES / soloPlanMath below). Money can     *
 * never be withdrawn as cash; it only ever becomes a product. Solo      *
 * plans deliver at 50%. Group Plans apply only to products of ₦100,000  *
 * or less (1–2 slots).                                                  *
 * ------------------------------------------------------------------ */

/** Naira paid per slot, per day. */
export const SLOT_DAILY = 1_000;

/** Days in one savings cycle. */
export const CYCLE_DAYS = 50;

/** Value a single slot accumulates over one completed cycle (₦1,000 × 50). */
export const SLOT_CYCLE_VALUE = SLOT_DAILY * CYCLE_DAYS; // ₦50,000

/** Highest product price eligible for a Group Plan. */
export const GROUP_PRICE_CAP = 100_000;

/** Maximum slots a single customer may hold in one group (a group purchase is always 1–2 slots). */
export const GROUP_MAX_SLOTS_PER_CUSTOMER = 2;

/** Fraction of the price at which a Solo Plan triggers delivery. */
export const SOLO_DELIVERY_THRESHOLD = 0.5;

export type PaymentOption = "outright" | "solo" | "group";

/** Slots required to cover a product price: ceil(price / 50,000). */
export function slotsForPrice(price: number): number {
  return Math.max(1, Math.ceil(price / SLOT_CYCLE_VALUE));
}

/** Strict daily payment for a number of slots: slots × ₦1,000. */
export function dailyForSlots(slots: number): number {
  return slots * SLOT_DAILY;
}

/** Strict daily payment to acquire a product on a Solo/Group plan. */
export function dailyForPrice(price: number): number {
  return dailyForSlots(slotsForPrice(price));
}

/** Whether a product may be paid via a Group Plan (₦100,000 or less). */
export function isGroupEligible(price: number): boolean {
  return price > 0 && price <= GROUP_PRICE_CAP;
}

/** Slots a price represents inside a group, capped at the per-customer maximum. */
export function groupSlotsForPrice(price: number): number {
  return Math.min(GROUP_MAX_SLOTS_PER_CUSTOMER, slotsForPrice(price));
}

export interface PlanMath {
  /** Slots required for the product. */
  slots: number;
  /** Strict daily payment (slots × ₦1,000). */
  daily: number;
  /** Days to fully pay the product off at the daily rate. */
  daysToComplete: number;
  /** Naira at which a Solo Plan delivers (50% of price). */
  deliveryTarget: number;
  /** Days of payment to reach the 50% solo delivery trigger. */
  daysToDelivery: number;
}

/** Derive the full slot-engine maths for a product price. */
export function planMath(price: number): PlanMath {
  const slots = slotsForPrice(price);
  const daily = dailyForSlots(slots);
  const deliveryTarget = Math.round(price * SOLO_DELIVERY_THRESHOLD);
  return {
    slots,
    daily,
    daysToComplete: Math.ceil(price / daily),
    deliveryTarget,
    daysToDelivery: Math.ceil(deliveryTarget / daily),
  };
}

/* ------------------------------------------------------------------ *
 * Solo plan — the customer chooses how AND when to pay.                 *
 * There is no slot lock: pick any amount, and pay it daily, weekly or   *
 * monthly. We just work out how long it takes to reach 50% and 100%.    *
 * ------------------------------------------------------------------ */

/** How often a customer pays into a Solo Plan. */
export type SoloFrequency = "daily" | "weekly" | "monthly";

export interface SoloFrequencyMeta {
  /** Display label, e.g. "Weekly". */
  label: string;
  /** Singular period noun, e.g. "week". */
  unit: string;
  /** Suffix for an amount, e.g. "/week". */
  per: string;
  /** Length of one payment period in days. */
  days: number;
  /** Smallest amount we accept per payment at this frequency. */
  min: number;
}

/** Per-frequency configuration. Order is the display order. */
export const SOLO_FREQUENCIES: Record<SoloFrequency, SoloFrequencyMeta> = {
  daily: { label: "Daily", unit: "day", per: "/day", days: 1, min: 100 },
  weekly: { label: "Weekly", unit: "week", per: "/week", days: 7, min: 500 },
  monthly: { label: "Monthly", unit: "month", per: "/month", days: 30, min: 2_000 },
};

/** Smallest daily amount we accept on a Solo Plan (kept for callers that default to daily). */
export const SOLO_MIN_DAILY = SOLO_FREQUENCIES.daily.min;

/**
 * Suggested per-payment amount at a frequency — a gentle default the customer
 * can freely change. We take a baseline daily pace for the price and scale it
 * to the chosen period (×7 weekly, ×30 monthly).
 */
export function suggestedSoloAmount(price: number, frequency: SoloFrequency): number {
  return dailyForPrice(price) * SOLO_FREQUENCIES[frequency].days;
}

export interface SoloPlanMath {
  /** The amount the customer chose to pay each period. */
  amount: number;
  /** How often that amount is paid. */
  frequency: SoloFrequency;
  /** Length of one payment period in days. */
  periodDays: number;
  /** The full item price. */
  price: number;
  /** Number of payments to fully pay the product off. */
  paymentsToComplete: number;
  /** Days to fully pay the product off at the chosen pace. */
  daysToComplete: number;
  /** Naira at which a Solo Plan delivers (50% of price). */
  deliveryTarget: number;
  /** Number of payments to reach the 50% solo delivery trigger. */
  paymentsToDelivery: number;
  /** Days of payment to reach the 50% solo delivery trigger. */
  daysToDelivery: number;
}

/**
 * Solo-plan maths for a customer-chosen amount paid daily, weekly or
 * monthly. The amount is whatever the customer picks (≥ the frequency
 * minimum); we work out how many payments — and days — it takes to reach
 * 50% (delivery) and 100% (fully paid).
 */
export function soloPlanMath(
  price: number,
  amount: number,
  frequency: SoloFrequency = "daily",
): SoloPlanMath {
  const meta = SOLO_FREQUENCIES[frequency];
  const safeAmount = Math.max(1, amount);
  const deliveryTarget = Math.round(price * SOLO_DELIVERY_THRESHOLD);
  const paymentsToComplete = Math.ceil(price / safeAmount);
  const paymentsToDelivery = Math.ceil(deliveryTarget / safeAmount);
  return {
    amount,
    frequency,
    periodDays: meta.days,
    price,
    paymentsToComplete,
    daysToComplete: paymentsToComplete * meta.days,
    deliveryTarget,
    paymentsToDelivery,
    daysToDelivery: paymentsToDelivery * meta.days,
  };
}

/** Format a naira amount with the ₦ symbol and en-NG grouping. */
export function naira(n: number): string {
  return `₦${Math.round(n).toLocaleString("en-NG")}`;
}
