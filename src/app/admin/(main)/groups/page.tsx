import type { Metadata } from "next";

import { GroupsBoard } from "./groups-board";

export const metadata: Metadata = { title: "Groups — OCare Phinas Admin" };

export default function AdminGroupsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 font-bold">Pay Small Small — Groups</h1>
        <p className="text-muted-foreground mt-1">1 slot = ₦1,000/day for 50 days. Members take 1–2 slots (items ≤ ₦100,000). A group auto-closes the moment its slots are all taken; capacity and closing are enforced server-side.</p>
      </div>

      <GroupsBoard />
    </div>
  );
}
