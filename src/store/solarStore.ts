import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  MOCK_SOLAR_PACKAGES,
  nextSolarReference,
  totalBalancePeriods,
  type SolarApplication,
  type SolarFrequency,
  type SolarIdType,
  type SolarPackage,
} from "@/lib/solar";

/* ------------------------------------------------------------------ *
 * Frontend-only simulation of the Solar Plan lifecycle (no backend).   *
 * Persisted to localStorage so the customer-side flow and admin-side   *
 * review/scheduling actions stay in sync across pages within the same  *
 * browser, exactly like `cartStore`. Phase 3 replaces this with real   *
 * `solar_applications` / `solar_packages` tables (see addendum §4).    *
 * ------------------------------------------------------------------ */

export interface NewSolarApplicationInput {
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  packageId: string;
  address: string;
  idType: SolarIdType;
  idDocumentName: string;
  utilityBillName: string;
  employmentDetails: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  chosenFrequency: SolarFrequency;
}

interface SolarStore {
  packages: SolarPackage[];
  applications: SolarApplication[];

  /* Admin — Solar Packages settings CRUD. */
  addPackage: (input: Omit<SolarPackage, "id">) => void;
  updatePackage: (id: string, fields: Partial<Omit<SolarPackage, "id">>) => void;
  removePackage: (id: string) => void;

  /* Customer. */
  submitApplication: (input: NewSolarApplicationInput) => SolarApplication;
  submitDepositPayment: (id: string) => void;
  reapply: (id: string) => void;

  /* Admin — KYC review, deposit confirm, installation, repayment. */
  approveApplication: (id: string, adminName: string) => void;
  rejectApplication: (id: string, adminName: string, reason: string) => void;
  confirmDeposit: (id: string) => void;
  rejectDeposit: (id: string) => void;
  scheduleInstallation: (id: string, adminName: string, date: string, time: string, notes?: string) => void;
  completeInstallation: (id: string) => void;
  confirmBalancePayment: (id: string, periodIndex: number) => void;
  markDefaulted: (id: string) => void;
}

export const useSolarStore = create<SolarStore>()(
  persist(
    (set, get) => ({
      packages: MOCK_SOLAR_PACKAGES,
      applications: [],

      addPackage: (input) =>
        set((s) => ({ packages: [...s.packages, { ...input, id: `pkg-${Date.now()}` }] })),

      updatePackage: (id, fields) =>
        set((s) => ({ packages: s.packages.map((p) => (p.id === id ? { ...p, ...fields } : p)) })),

      removePackage: (id) => set((s) => ({ packages: s.packages.filter((p) => p.id !== id) })),

      submitApplication: (input) => {
        const now = new Date().toISOString();
        const app: SolarApplication = {
          id: `sa-${Date.now()}`,
          reference: nextSolarReference(),
          ...input,
          status: "under_review",
          rejectionReason: null,
          reviewedBy: null,
          reviewedAt: null,
          registrationFeePaidAt: now,
          depositSubmittedAt: null,
          depositPaidAt: null,
          installation: {
            scheduledDate: null,
            scheduledTime: null,
            scheduledBy: null,
            scheduledAt: null,
            completedAt: null,
            notes: null,
          },
          activeRepaymentStartDate: null,
          paidPeriodIndices: [],
          createdAt: now,
        };
        set((s) => ({ applications: [app, ...s.applications] }));
        return app;
      },

      submitDepositPayment: (id) =>
        set((s) => ({
          applications: s.applications.map((a) =>
            a.id === id ? { ...a, depositSubmittedAt: new Date().toISOString() } : a,
          ),
        })),

      reapply: (id) =>
        set((s) => ({
          applications: s.applications.map((a) =>
            a.id === id
              ? { ...a, status: "under_review", rejectionReason: null, reviewedBy: null, reviewedAt: null }
              : a,
          ),
        })),

      approveApplication: (id, adminName) =>
        set((s) => ({
          applications: s.applications.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status: "approved_awaiting_deposit",
                  reviewedBy: adminName,
                  reviewedAt: new Date().toISOString(),
                  rejectionReason: null,
                }
              : a,
          ),
        })),

      rejectApplication: (id, adminName, reason) =>
        set((s) => ({
          applications: s.applications.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status: "not_approved",
                  reviewedBy: adminName,
                  reviewedAt: new Date().toISOString(),
                  rejectionReason: reason,
                }
              : a,
          ),
        })),

      confirmDeposit: (id) =>
        set((s) => ({
          applications: s.applications.map((a) =>
            a.id === id
              ? { ...a, status: "installation_processing", depositPaidAt: new Date().toISOString() }
              : a,
          ),
        })),

      rejectDeposit: (id) =>
        set((s) => ({
          applications: s.applications.map((a) => (a.id === id ? { ...a, depositSubmittedAt: null } : a)),
        })),

      scheduleInstallation: (id, adminName, date, time, notes) =>
        set((s) => ({
          applications: s.applications.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status: "installation_scheduled",
                  installation: {
                    ...a.installation,
                    scheduledDate: date,
                    scheduledTime: time,
                    scheduledBy: adminName,
                    scheduledAt: new Date().toISOString(),
                    notes: notes ?? a.installation.notes,
                  },
                }
              : a,
          ),
        })),

      completeInstallation: (id) =>
        set((s) => ({
          applications: s.applications.map((a) => {
            if (a.id !== id) return a;
            const now = new Date().toISOString();
            return {
              ...a,
              status: "active_repayment",
              installation: { ...a.installation, completedAt: now },
              activeRepaymentStartDate: now,
            };
          }),
        })),

      confirmBalancePayment: (id, periodIndex) =>
        set((s) => {
          const app = s.applications.find((a) => a.id === id);
          if (!app) return s;
          const pkg = get().packages.find((p) => p.id === app.packageId);
          const paidPeriodIndices = [...app.paidPeriodIndices, periodIndex].sort((x, y) => x - y);
          const total = pkg ? totalBalancePeriods(pkg, app.chosenFrequency) : Infinity;
          const status = paidPeriodIndices.length >= total ? "completed" : app.status;
          return {
            applications: s.applications.map((a) => (a.id === id ? { ...a, paidPeriodIndices, status } : a)),
          };
        }),

      markDefaulted: (id) =>
        set((s) => ({
          applications: s.applications.map((a) => (a.id === id ? { ...a, status: "defaulted" } : a)),
        })),
    }),
    { name: "ocare-solar-pss" },
  ),
);
