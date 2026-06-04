import type { Metadata } from "next";
import { Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Groups — OCare Phinas Admin" };

const MOCK_GROUPS = [
  { id: "1", ref: "G-017", slotsFilled: 3, totalSlots: 10, status: "open" as const, startDate: "2026-06-01" },
  { id: "2", ref: "G-016", slotsFilled: 10, totalSlots: 10, status: "closed" as const, startDate: "2026-05-20" },
  { id: "3", ref: "G-015", slotsFilled: 10, totalSlots: 10, status: "closed" as const, startDate: "2026-05-01" },
  { id: "4", ref: "G-014", slotsFilled: 10, totalSlots: 10, status: "completed" as const, startDate: "2026-04-01" },
];

const STATUS_META = {
  open: { label: "Open", variant: "success" as const },
  closed: { label: "Full", variant: "warning" as const },
  completed: { label: "Completed", variant: "secondary" as const },
};

export default function AdminGroupsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 font-bold">Pay Small Small — Groups</h1>
        <p className="text-muted-foreground mt-1">1 slot = ₦1,000/day for 50 days. Members take 1–2 slots (items ≤ ₦100,000). Groups are created automatically — a new group opens once the previous one fills all 10 slots, and each group auto-closes the moment its 10th slot is taken. Creation, capacity and closing are enforced server-side.</p>
      </div>

      <div className="space-y-4">
        {MOCK_GROUPS.map((group) => {
          const meta = STATUS_META[group.status];
          return (
            <div key={group.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                    <Users className="size-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-body font-bold font-mono">{group.ref}</span>
                      <Badge variant={meta.variant} className="text-micro">{meta.label}</Badge>
                    </div>
                    <p className="text-caption text-muted-foreground">Started {new Date(group.startDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })} · ₦1,000/day per slot · ₦50,000 per slot/cycle</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 rounded-lg border border-border text-body-sm hover:bg-muted transition-colors">View members</button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(group.slotsFilled / group.totalSlots) * 100}%` }} />
                </div>
                <span className="text-caption font-semibold flex-shrink-0">{group.slotsFilled}/{group.totalSlots} slots</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
