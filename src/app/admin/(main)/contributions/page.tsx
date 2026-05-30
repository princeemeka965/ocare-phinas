import type { Metadata } from "next";
import { CheckCircle, XCircle, Eye } from "lucide-react";

export const metadata: Metadata = { title: "Contributions — OCare Phinas Admin" };

const PENDING = [
  { id: "1", member: "Emeka Nwosu", plan: "Group G-013", amount: 1000, date: "2026-05-29", hasProof: true },
  { id: "2", member: "Chukwuemeka Anyanwu", plan: "Solo Plan", amount: 1000, date: "2026-05-29", hasProof: true },
  { id: "3", member: "Ngozi Eze", plan: "Group G-016", amount: 1000, date: "2026-05-29", hasProof: false },
];

export default function AdminContributionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 font-bold">Plan Contributions</h1>
        <p className="text-muted-foreground mt-1">Confirm daily payments from plan members. Confirming advances the day count and updates the member&apos;s ledger.</p>
      </div>

      {PENDING.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-16 text-center">
          <CheckCircle className="size-12 text-success mx-auto mb-3 opacity-50" />
          <p className="text-h3 font-semibold">All clear</p>
          <p className="text-body-sm text-muted-foreground mt-1">No contributions awaiting confirmation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {PENDING.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                <div>
                  <p className="text-body font-semibold">{c.member}</p>
                  <p className="text-body-sm text-muted-foreground">{c.plan} · {new Date(c.date).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
                <p className="text-h3 font-bold text-primary">₦{c.amount.toLocaleString("en-NG")}</p>
              </div>
              <div className="flex items-center gap-3">
                {c.hasProof ? (
                  <button className="flex items-center gap-1.5 text-body-sm text-primary font-medium hover:underline"><Eye className="size-4" /> View screenshot</button>
                ) : (
                  <span className="text-body-sm text-muted-foreground italic">No screenshot — verify via WhatsApp</span>
                )}
                <div className="ml-auto flex gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success text-white font-semibold text-body-sm hover:bg-success/90 transition-colors"><CheckCircle className="size-4" /> Confirm</button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-destructive/30 text-destructive font-semibold text-body-sm hover:bg-destructive/10 transition-colors"><XCircle className="size-4" /> Reject</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
