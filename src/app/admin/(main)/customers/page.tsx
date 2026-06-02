import type { Metadata } from "next";

import { MOCK_CUSTOMERS } from "@/lib/customers";
import { CustomersList } from "./customers-list";

export const metadata: Metadata = { title: "Customers — OCare Phinas Admin" };

export default function AdminCustomersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-h1 font-bold">Customers</h1>
      <CustomersList customers={MOCK_CUSTOMERS} />
    </div>
  );
}
