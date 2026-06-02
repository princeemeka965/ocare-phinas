/* ------------------------------------------------------------------ *
 * Plan contributions — manual Pay Small Small payment confirmations    *
 * ------------------------------------------------------------------ *
 * Members pay their daily contribution by manual bank transfer and     *
 * send a screenshot on WhatsApp. The system records WHO, WHICH PLAN,   *
 * HOW MUCH and WHEN — never the bank, sender or transaction ref.       *
 * Group payments are the strict slot daily (slots × ₦1,000); solo      *
 * payments are the member's chosen daily. Confirming advances the      *
 * plan and updates the member's ledger.                                *
 * Phase 3: replace with a real DB fetch.                               *
 * ------------------------------------------------------------------ */

export type ContributionStatus = "awaiting" | "confirmed" | "rejected";
export type PlanKind = "solo" | "group";

interface BaseContribution {
  id: string;
  member: { name: string; phone: string };
  reference: string;
  amount: number;
  date: string;
  status: ContributionStatus;
}

export type Contribution =
  | (BaseContribution & { type: "group"; slots: number })
  | (BaseContribution & { type: "solo" });

export const CONTRIB_STATUS_META: Record<ContributionStatus, { label: string; variant: "warning" | "success" | "destructive" }> = {
  awaiting: { label: "Awaiting confirmation", variant: "warning" },
  confirmed: { label: "Confirmed", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
};

export const MOCK_CONTRIBUTIONS: Contribution[] = [
  { id: "1", member: { name: "Emeka Nwosu", phone: "08022345678" }, type: "group", reference: "G-013", slots: 1, amount: 1000, date: "2026-05-29", status: "awaiting" },
  { id: "2", member: { name: "Chukwuemeka Anyanwu", phone: "08044567890" }, type: "solo", reference: "SOLO-0042", amount: 7000, date: "2026-05-29", status: "awaiting" },
  { id: "3", member: { name: "Ngozi Eze", phone: "08055678901" }, type: "group", reference: "G-016", slots: 2, amount: 2000, date: "2026-05-29", status: "awaiting" },
];

export function getContribution(id: string): Contribution | undefined {
  return MOCK_CONTRIBUTIONS.find((c) => c.id === id);
}

/** Human label for a contribution's plan + amount basis. */
export function contributionDetail(c: Contribution): string {
  return c.type === "group"
    ? `${c.reference} · ${c.slots} slot${c.slots !== 1 ? "s" : ""} · strict slot daily`
    : `${c.reference} · member's chosen daily`;
}
