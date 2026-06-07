import type { Metadata } from "next";

import { OrdersBoard } from "./orders-board";

export const metadata: Metadata = { title: "Orders — OCare Phinas Admin" };

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-h1 font-bold">Orders</h1>
      <OrdersBoard />
    </div>
  );
}
