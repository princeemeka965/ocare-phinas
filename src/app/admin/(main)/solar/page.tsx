import { Sun } from "lucide-react";

import { SolarApplicationsBoard } from "./solar-applications-board";

export default function AdminSolarApplicationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 font-bold flex items-center gap-2"><Sun className="size-6 text-primary" /> Solar Applications</h1>
        <p className="text-muted-foreground mt-1">
          Review KYC submissions, approve or reject applications, confirm deposits and schedule installations.
        </p>
      </div>
      <SolarApplicationsBoard />
    </div>
  );
}
