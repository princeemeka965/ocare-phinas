import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Orders — OCare Phinas Admin" };

type OrderStatus = "pending_payment" | "payment_submitted" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

const STATUS_TABS = ["All", "Awaiting confirmation", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"];

const STATUS_META: Record<OrderStatus, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
  pending_payment: { label: "Pending payment", variant: "warning" },
  payment_submitted: { label: "Awaiting confirmation", variant: "warning" },
  confirmed: { label: "Confirmed", variant: "success" },
  processing: { label: "Processing", variant: "default" },
  shipped: { label: "Shipped", variant: "default" },
  delivered: { label: "Delivered", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

const MOCK_ORDERS = [
  { id: "1", ref: "OCP-2026-00051", customer: "Adaeze Okonkwo", date: "2026-05-29", total: 65990, status: "payment_submitted" as OrderStatus },
  { id: "2", ref: "OCP-2026-00050", customer: "Emeka Nwosu", date: "2026-05-28", total: 22990, status: "confirmed" as OrderStatus },
  { id: "3", ref: "OCP-2026-00049", customer: "Bola Adesanya", date: "2026-05-28", total: 18900, status: "shipped" as OrderStatus },
  { id: "4", ref: "OCP-2026-00048", customer: "Chukwuemeka Anyanwu", date: "2026-05-25", total: 79990, status: "delivered" as OrderStatus },
  { id: "5", ref: "OCP-2026-00047", customer: "Ngozi Eze", date: "2026-05-20", total: 12500, status: "cancelled" as OrderStatus },
];

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-h1 font-bold">Orders</h1>

      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none border-b border-border pb-px">
        {STATUS_TABS.map((tab, i) => (
          <button key={tab} className={cn("flex-shrink-0 px-3 py-2 text-body-sm font-medium border-b-2 -mb-px transition-colors", i === 0 ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
            {tab}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Reference</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground hidden sm:table-cell">Customer</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground hidden md:table-cell">Date</th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Total</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {MOCK_ORDERS.map((order) => {
                const meta = STATUS_META[order.status];
                return (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold">{order.ref}</td>
                    <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{order.customer}</td>
                    <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{new Date(order.date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td className="py-3 px-4 text-right font-bold text-primary">₦{order.total.toLocaleString("en-NG")}</td>
                    <td className="py-3 px-4"><Badge variant={meta.variant} className="text-micro">{meta.label}</Badge></td>
                    <td className="py-3 px-4">
                      <Link href={`/admin/orders/${order.id}`} className="flex items-center gap-1 text-caption text-primary font-medium hover:underline">
                        View <ChevronRight className="size-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
