import type { Metadata } from "next";
import { Search, CheckCircle, Wallet } from "lucide-react";

export const metadata: Metadata = { title: "Customers — OCare Phinas Admin" };

const MOCK_CUSTOMERS = [
  { id: "1", name: "Adaeze Okonkwo", email: "adaeze@email.com", phone: "08011234567", verified: true, orders: 5, planTag: null },
  { id: "2", name: "Emeka Nwosu", email: "emeka@email.com", phone: "08022345678", verified: true, orders: 3, planTag: "Group #G-013" },
  { id: "3", name: "Bola Adesanya", email: "bola@email.com", phone: "08033456789", verified: false, orders: 1, planTag: null },
  { id: "4", name: "Chukwuemeka Anyanwu", email: "anyanwue4@gmail.com", phone: "08044567890", verified: true, orders: 7, planTag: "Solo Plan" },
  { id: "5", name: "Ngozi Eze", email: "ngozi@email.com", phone: "08055678901", verified: true, orders: 2, planTag: "Group #G-016" },
];

export default function AdminCustomersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-h1 font-bold">Customers</h1>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input type="search" placeholder="Search customers…" className="w-full h-9 pl-10 pr-4 rounded-lg border border-input bg-background text-body-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground hidden sm:table-cell">Contact</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Verified</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground hidden md:table-cell">Plan</th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {MOCK_CUSTOMERS.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-medium">{c.name}</td>
                  <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell"><p>{c.email}</p><p className="text-caption">{c.phone}</p></td>
                  <td className="py-3 px-4 text-center">{c.verified ? <CheckCircle className="size-4 text-success mx-auto" /> : <span className="text-caption text-muted-foreground">—</span>}</td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    {c.planTag ? <span className="flex items-center gap-1.5 text-caption text-primary font-medium"><Wallet className="size-3.5" />{c.planTag}</span> : <span className="text-caption text-muted-foreground">—</span>}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold">{c.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
