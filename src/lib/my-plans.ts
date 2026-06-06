/* ------------------------------------------------------------------ *
 * My Plans — the signed-in customer's Pay Small Small plans (mock)     *
 * ------------------------------------------------------------------ *
 * Shared by the My Plan dashboard, the profile page and the arrears     *
 * login banner so they all read the same plans and agree on what is     *
 * missed / overdue. Phase 3: replace with an authenticated fetch.       *
 * ------------------------------------------------------------------ */

import { paymentHealth, type PaymentHealth } from "./payment-health";
import type { SoloFrequency } from "./pay-small-small";

export type PlanType = "solo" | "group" | "outright";
// `completed` = fully paid off. A solo plan frees the customer's solo slot;
// a group plan removes them from the group and frees the group slot — only
// then can they start a new plan of that type. There is no "continue another
// cycle"; money only ever converts to a different product when the chosen one
// sells out (out-of-stock substitution — payment-flow §7).
export type PlanStatus = "active" | "processing" | "delivered" | "completed";

export interface Plan {
  id: string;
  type: PlanType;
  reference: string;
  productName: string;
  productImage: string;
  productPrice: number;
  slots?: number; // group only — the shared slot pool
  frequency?: SoloFrequency; // solo only — how often the customer pays
  daily: number; // amount paid each period
  amountAllocated: number;
  status: PlanStatus;
  position?: number; // group position
  /** ISO date the payment schedule began — drives missed/overdue maths. */
  startDate: string;
}

export type ContribStatus = "confirmed" | "awaiting" | "rejected";
export interface Contribution {
  id: string;
  date: string;
  amount: number;
  plan: string;
  status: ContribStatus;
}

/* ------------------------------------------------------------------ */
/* Mock wallet + plans — replace with authenticated fetch in Phase 3.  */
/* One account, one wallet, many concurrent plans (payment-flow §1,§4) */
/* Money never withdraws as cash — it only ever becomes a product.     */
/* ------------------------------------------------------------------ */
export const MOCK_PLANS: Plan[] = [
  {
    id: "p1",
    type: "solo",
    reference: "SOLO-0042",
    productName: "Haier Thermocool Chest Freezer 300L",
    productImage: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&h=400&fit=crop&q=85",
    productPrice: 350000,
    frequency: "daily",
    daily: 7000,
    amountAllocated: 196000, // past 50% → delivered, owes balance — now overdue
    status: "delivered",
    startDate: "2026-04-01", // 50-day track ended 2026-05-21; balance still owed → overdue
  },
  {
    id: "p2",
    type: "group",
    reference: "G-016",
    productName: 'LG OLED evo C3 55" 4K Smart TV',
    productImage: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400&h=400&fit=crop&q=85",
    productPrice: 89990,
    slots: 2,
    daily: 2000,
    amountAllocated: 84000, // behind the daily schedule but still in window → missed
    status: "active",
    position: 8,
    startDate: "2026-04-23",
  },
];

/* Wallet: total = everything paid in not yet consumed by a delivered product;
   allocations = committed to active plans; available = uncommitted. */
export const MOCK_WALLET = {
  total: 105000,
  available: 5000,
};

export const MOCK_CONTRIBUTIONS: Contribution[] = [
  { id: "c1", date: "2026-06-01", amount: 7000, plan: "SOLO-0042", status: "awaiting" },
  { id: "c2", date: "2026-06-01", amount: 2000, plan: "G-016", status: "awaiting" },
  { id: "c3", date: "2026-05-31", amount: 7000, plan: "SOLO-0042", status: "confirmed" },
  { id: "c4", date: "2026-05-31", amount: 2000, plan: "G-016", status: "confirmed" },
  { id: "c5", date: "2026-05-30", amount: 7000, plan: "SOLO-0042", status: "confirmed" },
  { id: "c6", date: "2026-05-29", amount: 2000, plan: "G-016", status: "rejected" },
  { id: "c7", date: "2026-05-28", amount: 7000, plan: "SOLO-0042", status: "confirmed" },
];

/** Whether a plan is on a live payment schedule that can fall into arrears. */
export function isPayablePlan(plan: Plan): boolean {
  return plan.status === "active" || plan.status === "delivered" || plan.status === "processing";
}

/**
 * Payment health for a plan, or null if it is not on a live schedule
 * (e.g. a completed plan). Group plans pay the slot daily; solo plans
 * pay the customer's chosen amount on their chosen cadence.
 */
export function planHealth(plan: Plan, now?: Date): PaymentHealth | null {
  if (!isPayablePlan(plan)) return null;
  return paymentHealth({
    price: plan.productPrice,
    amountPaid: plan.amountAllocated,
    perPayment: plan.daily,
    frequency: plan.type === "solo" ? plan.frequency ?? "daily" : "daily",
    startDate: plan.startDate,
    now,
  });
}
