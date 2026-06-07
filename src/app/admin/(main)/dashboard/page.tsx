import type { Metadata } from "next";

import { DashboardBoard } from "./dashboard-board";

export const metadata: Metadata = { title: "Dashboard — OCare Phinas Admin" };

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-h1 font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <DashboardBoard />
    </div>
  );
}
