/* ------------------------------------------------------------------ *
 * Solar Pay Small Small — "Solar Power Flex Plan"                      *
 * ------------------------------------------------------------------ *
 * Pure display helpers/constants shared by the customer and admin      *
 * solar pages. Row types live in src/lib/db/types.ts (SolarPackage,     *
 * SolarApplication, SolarInstallation); the lifecycle itself lives in   *
 * src/lib/server/solar-lifecycle.ts. See ocare-phinas-solar-plan-       *
 * addendum.md for the full design.                                     *
 * ------------------------------------------------------------------ */

import type { PlanFrequency, SolarApplicationStatus, SolarIdType, SolarPackage } from "@/lib/db/types";

/** Solar reuses the same three cadences as Solo, but with fixed (not customer-chosen) amounts. */
export type SolarFrequency = PlanFrequency;

export const SOLAR_ID_TYPES: { value: SolarIdType; label: string }[] = [
  { value: "nin", label: "National ID (NIN)" },
  { value: "drivers_license", label: "Driver's Licence" },
  { value: "voters_card", label: "Voter's Card" },
  { value: "passport", label: "International Passport" },
];

/** Balance remaining after the deposit — derived from the package price, never independently set. */
export function packageBalance(pkg: SolarPackage): number {
  return Math.max(0, pkg.totalAmount - pkg.initialDeposit);
}

export type SolarBadgeVariant = "default" | "success" | "warning" | "destructive" | "secondary";

export const SOLAR_STATUS_META: Record<
  SolarApplicationStatus,
  { label: string; badge: SolarBadgeVariant; description: string }
> = {
  under_review: {
    label: "Under review",
    badge: "warning",
    description: "Our team is verifying your documents and payment history.",
  },
  not_approved: {
    label: "Not approved",
    badge: "destructive",
    description: "Your application wasn't approved this time.",
  },
  approved_awaiting_deposit: {
    label: "Approved — awaiting deposit",
    badge: "success",
    description: "Pay your initial deposit to begin installation scheduling.",
  },
  installation_processing: {
    label: "Installation processing",
    badge: "default",
    description: "Deposit confirmed — awaiting an installation date.",
  },
  installation_scheduled: {
    label: "Installation scheduled",
    badge: "default",
    description: "Your installation date and time have been set.",
  },
  active_repayment: {
    label: "Active — repaying balance",
    badge: "default",
    description: "Installed. Keep up your repayment schedule to stay on track.",
  },
  completed: {
    label: "Completed",
    badge: "secondary",
    description: "Fully paid off — thank you for completing your plan.",
  },
  defaulted: {
    label: "Defaulted",
    badge: "destructive",
    description: "Repayment lapsed for an extended period — this affects future solar eligibility.",
  },
};

/** The main forward progression (excludes the "not_approved" branch). */
export const SOLAR_STATUS_FLOW: SolarApplicationStatus[] = [
  "under_review",
  "approved_awaiting_deposit",
  "installation_processing",
  "installation_scheduled",
  "active_repayment",
  "completed",
];

/** The cadence option a chosen frequency resolves to for a given package. */
export function cadenceFor(pkg: SolarPackage, frequency: SolarFrequency) {
  return pkg.cadenceOptions.find((c) => c.frequency === frequency) ?? pkg.cadenceOptions[0];
}

/** Total scheduled periods to clear a package's balance at a given cadence. */
export function totalBalancePeriods(pkg: SolarPackage, frequency: SolarFrequency): number {
  return Math.ceil(packageBalance(pkg) / cadenceFor(pkg, frequency).amount);
}
