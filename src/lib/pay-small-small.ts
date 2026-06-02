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
 * Group Plans are STRICTLY the daily amount — no paying ahead, no      *
 * custom amounts, no weekly/monthly. Solo Plans are the exception:     *
 * the customer chooses ANY daily amount they like (the slot daily is   *
 * only offered as a suggestion). Money can never be withdrawn as cash; *
 * it only ever becomes a product. Solo plans deliver at 50%.           *
 * Group Plans apply only to products of ₦100,000 or less (1–2 slots).  *
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

/** Smallest daily amount we accept on a Solo Plan. */
export const SOLO_MIN_DAILY = 100;

export interface SoloPlanMath {
  /** The daily amount the customer chose. */
  daily: number;
  /** The full item price. */
  price: number;
  /** Days to fully pay the product off at the chosen daily rate. */
  daysToComplete: number;
  /** Naira at which a Solo Plan delivers (50% of price). */
  deliveryTarget: number;
  /** Days of payment to reach the 50% solo delivery trigger. */
  daysToDelivery: number;
}

/**
 * Solo-plan maths for a customer-chosen daily amount. Unlike the slot
 * engine, the daily payment is whatever the customer picks (≥ ₦100);
 * we just work out how long it takes to reach 50% and 100%.
 */
export function soloPlanMath(price: number, daily: number): SoloPlanMath {
  const safeDaily = Math.max(1, daily);
  const deliveryTarget = Math.round(price * SOLO_DELIVERY_THRESHOLD);
  return {
    daily,
    price,
    daysToComplete: Math.ceil(price / safeDaily),
    deliveryTarget,
    daysToDelivery: Math.ceil(deliveryTarget / safeDaily),
  };
}

/** Format a naira amount with the ₦ symbol and en-NG grouping. */
export function naira(n: number): string {
  return `₦${Math.round(n).toLocaleString("en-NG")}`;
}
