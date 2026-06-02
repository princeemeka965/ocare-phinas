import type { Metadata } from "next";

import { MOCK_ORDERS } from "@/lib/orders";
import { OrdersTable } from "./orders-table";

export const metadata: Metadata = { title: "Orders — OCare Phinas Admin" };

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-h1 font-bold">Orders</h1>
      <OrdersTable orders={MOCK_ORDERS} />
    </div>
  );
}
