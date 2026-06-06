/* ------------------------------------------------------------------ *
 * Customers — shared mock data + wallet model                          *
 * ------------------------------------------------------------------ *
 * One account, one wallet, many concurrent Pay Small Small plans.      *
 * The wallet never pays out cash — money only ever becomes a product;  *
 * "spent on products" is the running total already converted.          *
 * Phase 3: replace MOCK_CUSTOMERS / getters with a real DB fetch.      *
 * ------------------------------------------------------------------ */

import { MOCK_ORDERS, type Order } from "./orders";
import { paymentHealth, isArrears, type PaymentHealth } from "./payment-health";
import type { SoloFrequency } from "./pay-small-small";

export type PlanKind = "solo" | "group";

/** A plan's live payment schedule — drives missed / overdue detection. */
export interface PlanSchedule {
  /** Full product price the plan is paying toward. */
  price: number;
  /** Total confirmed contributions allocated to the plan. */
  amountPaid: number;
  /** Amount expected each period (solo: chosen; group: slot daily). */
  perPayment: number;
  /** Cadence the customer pays on. */
  frequency: SoloFrequency;
  /** ISO date the payment schedule began. */
  startDate: string;
  /** Whether the product has already been handed over (solo delivers at 50%). */
  delivered: boolean;
}

export interface CustomerPlan {
  type: PlanKind;
  reference: string;
  /** Present while the plan is on a live payment schedule. */
  schedule?: PlanSchedule;
}

export interface Wallet {
  /** Committed to active solo plans. */
  soloAllocations: number;
  /** Committed to active group plans. */
  groupAllocations: number;
  /** Uncommitted balance — can start a plan or top up, never cashed out. */
  available: number;
  /** Lifetime amount already converted into delivered products. */
  spentOnProducts: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  verified: boolean;
  blocked: boolean;
  joined: string;
  plans: CustomerPlan[];
  orderCount: number;
  wallet: Wallet;
}

/** Wallet balance = everything paid in and not yet consumed by a product. */
export function walletBalance(w: Wallet): number {
  return w.soloAllocations + w.groupAllocations + w.available;
}

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: "1", name: "Adaeze Okonkwo", email: "adaeze@email.com", phone: "08011234567",
    verified: true, blocked: false, joined: "2026-02-14", plans: [], orderCount: 5,
    wallet: { soloAllocations: 0, groupAllocations: 0, available: 0, spentOnProducts: 0 },
  },
  {
    id: "2", name: "Emeka Nwosu", email: "emeka@email.com", phone: "08022345678",
    verified: true, blocked: false, joined: "2026-03-02",
    plans: [{
      type: "group", reference: "G-013",
      schedule: { price: 50000, amountPaid: 13000, perPayment: 1000, frequency: "daily", startDate: "2026-05-25", delivered: false },
    }],
    orderCount: 3,
    wallet: { soloAllocations: 0, groupAllocations: 13000, available: 2000, spentOnProducts: 0 },
  },
  {
    id: "3", name: "Bola Adesanya", email: "bola@email.com", phone: "08033456789",
    verified: false, blocked: true, joined: "2026-04-19", plans: [], orderCount: 1,
    wallet: { soloAllocations: 0, groupAllocations: 0, available: 0, spentOnProducts: 0 },
  },
  {
    id: "4", name: "Chukwuemeka Anyanwu", email: "anyanwue4@gmail.com", phone: "08044567890",
    verified: true, blocked: false, joined: "2026-01-08",
    plans: [{
      type: "solo", reference: "SOLO-0042",
      // Delivered at 50%, then stopped paying — the 50-day track ended 2026-05-21.
      schedule: { price: 350000, amountPaid: 196000, perPayment: 7000, frequency: "daily", startDate: "2026-04-01", delivered: true },
    }],
    orderCount: 7,
    wallet: { soloAllocations: 196000, groupAllocations: 0, available: 5000, spentOnProducts: 175000 },
  },
  {
    id: "5", name: "Ngozi Eze", email: "ngozi@email.com", phone: "08055678901",
    verified: true, blocked: false, joined: "2026-05-11",
    plans: [{
      type: "group", reference: "G-016",
      schedule: { price: 89990, amountPaid: 40000, perPayment: 2000, frequency: "daily", startDate: "2026-05-14", delivered: false },
    }],
    orderCount: 2,
    wallet: { soloAllocations: 0, groupAllocations: 40000, available: 0, spentOnProducts: 0 },
  },
];

/** Payment health for one of a customer's plans, or null if no live schedule. */
export function planScheduleHealth(plan: CustomerPlan, now?: Date): PaymentHealth | null {
  if (!plan.schedule) return null;
  const s = plan.schedule;
  return paymentHealth({
    price: s.price,
    amountPaid: s.amountPaid,
    perPayment: s.perPayment,
    frequency: s.frequency,
    startDate: s.startDate,
    now,
  });
}

/** A customer's plans paired with their computed health. */
export interface CustomerPlanHealth {
  customer: Customer;
  plan: CustomerPlan;
  health: PaymentHealth;
}

/** Every plan across all customers that is currently missed or overdue. */
export function arrearsAcrossCustomers(now?: Date): CustomerPlanHealth[] {
  const rows: CustomerPlanHealth[] = [];
  for (const customer of MOCK_CUSTOMERS) {
    for (const plan of customer.plans) {
      const health = planScheduleHealth(plan, now);
      if (health && isArrears(health.status)) {
        rows.push({ customer, plan, health });
      }
    }
  }
  /* Overdue first, then by amount owed (largest first). */
  return rows.sort((a, b) => {
    if (a.health.status !== b.health.status) return a.health.status === "overdue" ? -1 : 1;
    return b.health.arrears - a.health.arrears;
  });
}

export function getCustomer(id: string): Customer | undefined {
  return MOCK_CUSTOMERS.find((c) => c.id === id);
}

/** Orders placed by a customer (matched by email). */
export function getCustomerOrders(customer: Customer): Order[] {
  return MOCK_ORDERS.filter((o) => o.customer.email === customer.email);
}
