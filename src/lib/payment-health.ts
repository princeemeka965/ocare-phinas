/* ------------------------------------------------------------------ *
 * Payment Health — missed & overdue tracking for Pay Small Small       *
 * ------------------------------------------------------------------ *
 * Single source of truth for arrears logic. See                        *
 * ocare-phinas-payment-flow.md §13 (Missed & Overdue Payments).        *
 *                                                                      *
 * The risk is real once a Solo Plan has delivered at 50%: the customer  *
 * holds the goods but still owes the balance, paid on a cadence. The    *
 * same maths also flags any plan that has fallen behind its daily/      *
 * weekly/monthly schedule.                                              *
 *                                                                      *
 *   on_track  — paid up to (or ahead of) what the schedule expects.     *
 *   missed    — behind schedule, but still inside the agreed window.    *
 *   overdue   — the completion deadline has passed with a balance left. *
 *   settled   — fully paid off; nothing outstanding.                    *
 *                                                                      *
 * Nothing here ever withdraws money — arrears are amounts still OWED.   *
 * ------------------------------------------------------------------ */

import { SOLO_FREQUENCIES, type SoloFrequency } from "./pay-small-small";

export type PaymentHealthStatus = "on_track" | "missed" | "overdue" | "settled";

export interface PaymentScheduleInput {
  /** Full product price the plan is paying toward. */
  price: number;
  /** Total confirmed contributions allocated to the plan. */
  amountPaid: number;
  /** Amount expected each period (solo: chosen daily; group: slot daily). */
  perPayment: number;
  /** Cadence the customer pays on. */
  frequency: SoloFrequency;
  /** ISO date the payment schedule began. */
  startDate: string;
  /** Override "now" (defaults to the current date). */
  now?: Date;
}

export interface PaymentHealth {
  status: PaymentHealthStatus;
  /** Money still owed on the product (price − amountPaid). */
  balance: number;
  /** Amount currently in arrears — the behind-schedule shortfall while
   *  `missed`, or the whole remaining balance once `overdue`. 0 otherwise. */
  arrears: number;
  /** Whole scheduled payments the customer has skipped. */
  missedPeriods: number;
  /** What the schedule says should have been paid by now. */
  expectedPaidByNow: number;
  perPayment: number;
  frequency: SoloFrequency;
  /** ISO date by which the balance should have been cleared. */
  completionDeadline: string;
  /** ISO date the next payment is due. */
  nextDueDate: string;
  /** Days past the completion deadline (0 unless overdue). */
  daysOverdue: number;
}

const DAY_MS = 86_400_000;

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/**
 * Derive a plan's payment health from its schedule. Pure — give it the
 * same inputs and it always returns the same result, so the customer
 * dashboard, the login banner and the admin arrears views all agree.
 */
export function paymentHealth(input: PaymentScheduleInput): PaymentHealth {
  const { price, amountPaid, frequency, startDate } = input;
  const now = input.now ?? new Date();
  const periodDays = SOLO_FREQUENCIES[frequency].days;
  const perPayment = Math.max(1, input.perPayment);

  const balance = Math.max(0, price - amountPaid);
  const start = new Date(startDate);
  const totalPayments = Math.ceil(price / perPayment);
  const completionDeadline = addDays(start, totalPayments * periodDays);

  /* Whole periods elapsed since the schedule began. */
  const elapsedPeriods = Math.max(
    0,
    Math.floor((now.getTime() - start.getTime()) / (periodDays * DAY_MS)),
  );
  const expectedPaidByNow = Math.min(price, elapsedPeriods * perPayment);
  const behind = Math.max(0, expectedPaidByNow - amountPaid);
  const missedPeriods = Math.round(behind / perPayment);

  const daysOverdue = Math.max(
    0,
    Math.floor((now.getTime() - completionDeadline.getTime()) / DAY_MS),
  );

  /* Next payment is one period after the last one the customer has funded. */
  const paymentsMade = Math.floor(amountPaid / perPayment);
  const nextDueDate = addDays(start, (paymentsMade + 1) * periodDays);

  let status: PaymentHealthStatus;
  if (balance <= 0) status = "settled";
  else if (now.getTime() > completionDeadline.getTime()) status = "overdue";
  else if (behind > 0) status = "missed";
  else status = "on_track";

  const arrears = status === "overdue" ? balance : status === "missed" ? behind : 0;

  return {
    status,
    balance,
    arrears,
    missedPeriods,
    expectedPaidByNow,
    perPayment,
    frequency,
    completionDeadline: completionDeadline.toISOString(),
    nextDueDate: nextDueDate.toISOString(),
    daysOverdue,
  };
}

/* ------------------------------------------------------------------ *
 * Payment schedule — the per-period record an admin confirms manually.  *
 * ------------------------------------------------------------------ *
 * Payment is a manual bank transfer, so the system can never detect a   *
 * payment on its own — staff confirm each scheduled period (a Solo      *
 * plan's chosen day/week/month, or a Group plan's strict slot daily)    *
 * once the customer says they've paid. Periods the customer should have  *
 * paid but hasn't surface as `missed`; once the whole schedule's        *
 * deadline passes with a balance left, the plan is `overdue`.           *
 * ------------------------------------------------------------------ */

export type PlanPeriodStatus = "paid" | "due" | "missed" | "upcoming";

export interface PlanPeriod {
  /** 1-based payment number. */
  index: number;
  /** ISO date this payment is due (= start + index × period). */
  dueDate: string;
  /** Expected amount (the final period carries any remainder). */
  amount: number;
  status: PlanPeriodStatus;
}

export interface PlanPeriodsInput {
  /** Full product price the plan pays toward. */
  price: number;
  /** Amount expected each period (solo: chosen; group: slot daily). */
  perPayment: number;
  /** Cadence (solo: the customer's choice; group: always daily). */
  frequency: SoloFrequency;
  /** ISO date the schedule began. */
  startDate: string;
  /** Payment numbers the admin has confirmed as paid. */
  paidIndices: number[];
  /** Override "now" (defaults to the current date). */
  now?: Date;
}

/**
 * Build the full list of scheduled payments for a plan, each tagged
 * paid / due / missed / upcoming. `due` is the current payment to chase;
 * `missed` are past-due and unpaid (these feed the arrears section);
 * `upcoming` are future periods — not yet payable (no paying ahead).
 */
export function planPeriods(input: PlanPeriodsInput): PlanPeriod[] {
  const { price, frequency, startDate, paidIndices } = input;
  const now = input.now ?? new Date();
  const periodDays = SOLO_FREQUENCIES[frequency].days;
  const perPayment = Math.max(1, input.perPayment);
  const total = Math.ceil(price / perPayment);
  const start = new Date(startDate);
  const paid = new Set(paidIndices);

  /* Payments whose due date has already passed. */
  const elapsedDue = Math.max(
    0,
    Math.floor((now.getTime() - start.getTime()) / (periodDays * DAY_MS)),
  );

  const periods: PlanPeriod[] = [];
  for (let i = 1; i <= total; i++) {
    const amount = i < total ? perPayment : price - perPayment * (total - 1);
    let status: PlanPeriodStatus;
    if (paid.has(i)) status = "paid";
    else if (i <= elapsedDue) status = "missed";
    else if (i === elapsedDue + 1) status = "due";
    else status = "upcoming";
    periods.push({ index: i, dueDate: addDays(start, i * periodDays).toISOString(), amount, status });
  }
  return periods;
}

/** Sum the amounts of the periods the admin has confirmed as paid. */
export function paidFromPeriods(periods: PlanPeriod[]): number {
  return periods.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
}

/** Badge variant + label per health status (variants match the UI Badge). */
export const HEALTH_META: Record<
  PaymentHealthStatus,
  { label: string; badge: "success" | "warning" | "destructive" | "secondary" }
> = {
  on_track: { label: "On track", badge: "success" },
  missed: { label: "Missed payments", badge: "warning" },
  overdue: { label: "Overdue", badge: "destructive" },
  settled: { label: "Settled", badge: "secondary" },
};

/** True when the plan owes money it should already have paid. */
export function isArrears(status: PaymentHealthStatus): boolean {
  return status === "missed" || status === "overdue";
}

/** Roll several plan healths into one headline for banners / summaries. */
export function arrearsSummary(healths: PaymentHealth[]): {
  status: PaymentHealthStatus;
  total: number;
  overdueTotal: number;
  missedTotal: number;
  count: number;
} {
  const inArrears = healths.filter((h) => isArrears(h.status));
  const overdueTotal = inArrears
    .filter((h) => h.status === "overdue")
    .reduce((s, h) => s + h.arrears, 0);
  const missedTotal = inArrears
    .filter((h) => h.status === "missed")
    .reduce((s, h) => s + h.arrears, 0);
  const status: PaymentHealthStatus = overdueTotal > 0 ? "overdue" : missedTotal > 0 ? "missed" : "settled";
  return {
    status,
    total: overdueTotal + missedTotal,
    overdueTotal,
    missedTotal,
    count: inArrears.length,
  };
}
