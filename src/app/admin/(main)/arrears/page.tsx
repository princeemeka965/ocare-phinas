import type { Metadata } from "next";

import { ArrearsBoard } from "./arrears-board";

export const metadata: Metadata = { title: "Arrears — OCare Phinas Admin" };

export default function AdminArrearsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 font-bold">Arrears</h1>
        <p className="text-muted-foreground mt-1">
          Customers who have fallen behind on Pay Small Small payments. A plan is <strong>missed</strong> while it is behind
          schedule but still inside its agreed window, and <strong>overdue</strong> once the completion deadline has passed
          with a balance still owed — highest risk where the item is already delivered. Nudge customers on WhatsApp to
          catch up.
        </p>
      </div>

      <ArrearsBoard />
    </div>
  );
}
