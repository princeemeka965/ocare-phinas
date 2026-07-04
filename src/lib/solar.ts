/* ------------------------------------------------------------------ *
 * Solar Pay Small Small — "Solar Power Flex Plan"                      *
 * ------------------------------------------------------------------ *
 * See ocare-phinas-solar-plan-addendum.md. A distinct plan type from   *
 * Solo/Group: gated by a KYC application + admin approval, a           *
 * non-refundable registration fee, a flat initial deposit that         *
 * triggers installation scheduling, then an ongoing balance            *
 * repayment on a fixed daily/weekly/monthly cadence (reusing the same  *
 * payment-health.ts schedule engine as Solo plans).                    *
 *                                                                      *
 * FRONTEND SIMULATION ONLY — no backend/API calls. All state lives in  *
 * src/store/solarStore.ts (persisted client-side), standing in for     *
 * `solar_applications` / `solar_packages` until Phase 3 wires this up  *
 * to Supabase.                                                         *
 * ------------------------------------------------------------------ */

import type { SoloFrequency } from "./pay-small-small";

/** Solar reuses the same three cadences as Solo, but with fixed (not customer-chosen) amounts. */
export type SolarFrequency = SoloFrequency;

export type SolarIdType = "nin" | "drivers_license" | "voters_card" | "passport";

export const SOLAR_ID_TYPES: { value: SolarIdType; label: string }[] = [
  { value: "nin", label: "National ID (NIN)" },
  { value: "drivers_license", label: "Driver's Licence" },
  { value: "voters_card", label: "Voter's Card" },
  { value: "passport", label: "International Passport" },
];

export interface SolarCadenceOption {
  frequency: SolarFrequency;
  /** Fixed amount per period for this cadence — not customer-chosen. */
  amount: number;
}

export interface SolarPackage {
  id: string;
  name: string;
  description: string;
  /** Non-refundable, paid before review even begins. Not part of the package price. */
  registrationFee: number;
  /** Flat deposit that triggers installation once confirmed. */
  initialDeposit: number;
  /** Total price of the solar system — the balance is whatever remains after the deposit. */
  totalAmount: number;
  cadenceOptions: SolarCadenceOption[];
  active: boolean;
}

/** Balance remaining after the deposit — derived from the package price, never independently set. */
export function packageBalance(pkg: SolarPackage): number {
  return Math.max(0, pkg.totalAmount - pkg.initialDeposit);
}

export const MOCK_SOLAR_PACKAGES: SolarPackage[] = [
  {
    id: "solar-flex-1",
    name: "Solar Power Flex Plan",
    description:
      "A complete solar power system, professionally installed at your home or business — pay a small deposit up front, then clear the balance on a pace that suits you.",
    registrationFee: 5_000,
    initialDeposit: 50_000,
    totalAmount: 850_000,
    cadenceOptions: [
      { frequency: "daily", amount: 2_000 },
      { frequency: "weekly", amount: 15_000 },
      { frequency: "monthly", amount: 60_000 },
    ],
    active: true,
  },
];

export type SolarApplicationStatus =
  | "under_review"
  | "not_approved"
  | "approved_awaiting_deposit"
  | "installation_processing"
  | "installation_scheduled"
  | "active_repayment"
  | "completed"
  | "defaulted";

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

export interface SolarInstallation {
  scheduledDate: string | null;
  /** "HH:mm" 24-hour. */
  scheduledTime: string | null;
  scheduledBy: string | null;
  scheduledAt: string | null;
  completedAt: string | null;
  notes: string | null;
}

export interface SolarApplication {
  id: string;
  reference: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  packageId: string;

  /* KYC — name/email/phone are read from the account, never re-collected here. */
  address: string;
  idType: SolarIdType;
  idDocumentName: string | null;
  utilityBillName: string | null;
  employmentDetails: string;
  emergencyContactName: string;
  emergencyContactPhone: string;

  status: SolarApplicationStatus;
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;

  registrationFeePaidAt: string;
  chosenFrequency: SolarFrequency;

  /** Customer says they've transferred the deposit — awaiting admin confirmation. */
  depositSubmittedAt: string | null;
  /** Admin has confirmed the deposit on their bank statement — this is what unlocks installation. */
  depositPaidAt: string | null;
  installation: SolarInstallation;

  /** = installation.completedAt — the balance schedule's start date. */
  activeRepaymentStartDate: string | null;
  /** Periods an admin has confirmed on the balance repayment schedule. */
  paidPeriodIndices: number[];

  createdAt: string;
}

/** The cadence option a chosen frequency resolves to for a given package. */
export function cadenceFor(pkg: SolarPackage, frequency: SolarFrequency): SolarCadenceOption {
  return pkg.cadenceOptions.find((c) => c.frequency === frequency) ?? pkg.cadenceOptions[0];
}

/** Total scheduled periods to clear a package's balance at a given cadence. */
export function totalBalancePeriods(pkg: SolarPackage, frequency: SolarFrequency): number {
  return Math.ceil(packageBalance(pkg) / cadenceFor(pkg, frequency).amount);
}

export function nextSolarReference(): string {
  return `SOL-${Date.now().toString().slice(-6)}`;
}
