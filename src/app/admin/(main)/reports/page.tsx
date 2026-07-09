import type { Metadata } from "next";

import { ReportsBoard } from "./reports-board";

export const metadata: Metadata = { title: "Reports — OCare Phinas Admin" };

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 font-bold">Reports</h1>
        <p className="text-muted-foreground mt-1">
          Revenue realized, outstanding payments and wallet totals across the whole platform. Superadmin only.
        </p>
      </div>

      <ReportsBoard />
    </div>
  );
}
