import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Products — OCare Phinas Admin" };

const MOCK_PRODUCTS = [
  { id: "1", name: "Samsung Galaxy S24 Ultra 256GB", category: "Phones", brand: "Samsung", condition: "new" as const, price: 65990, stock: 12, active: true, image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=80&h=80&fit=crop&q=80" },
  { id: "2", name: "Apple MacBook Air 13-inch M3", category: "Laptops", brand: "Apple", condition: "new" as const, price: 79990, stock: 5, active: true, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=80&h=80&fit=crop&q=80" },
  { id: "3", name: "iPhone 13 Pro 256GB (UK Used)", category: "Phones", brand: "Apple", condition: "pre_owned" as const, price: 34990, stock: 4, active: true, image: "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=80&h=80&fit=crop&q=80" },
  { id: "4", name: "Sony WH-1000XM5 Headphones", category: "Audio", brand: "Sony", condition: "new" as const, price: 22990, stock: 8, active: true, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80&h=80&fit=crop&q=80" },
  { id: "5", name: "Binatone Standing Fan 16-inch", category: "Appliances", brand: "Binatone", condition: "new" as const, price: 12500, stock: 20, active: true, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80&h=80&fit=crop&q=80" },
  { id: "6", name: 'LG OLED 55" 4K Smart TV', category: "Appliances", brand: "LG", condition: "new" as const, price: 89990, stock: 2, active: false, image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=80&h=80&fit=crop&q=80" },
];

export default function AdminProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-h1 font-bold">Products</h1>
        <Link href="/admin/products/new" className={cn(buttonVariants(), "gap-2")}>
          <Plus className="size-4" /> Add product
        </Link>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input type="search" placeholder="Search products…" className="w-full h-9 pl-10 pr-4 rounded-lg border border-input bg-background text-body-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
        </div>
        <select className="h-9 px-3 rounded-lg border border-input bg-background text-body-sm focus:outline-none">
          <option value="">All categories</option>
          <option>Phones</option><option>Laptops</option><option>Audio</option><option>Appliances</option>
        </select>
        <select className="h-9 px-3 rounded-lg border border-input bg-background text-body-sm focus:outline-none">
          <option value="">All conditions</option>
          <option value="new">New</option><option value="pre_owned">Pre-owned</option>
        </select>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Product</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground hidden md:table-cell">Category</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground hidden sm:table-cell">Condition</th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Price</th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground hidden sm:table-cell">Stock</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Active</th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {MOCK_PRODUCTS.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg overflow-hidden border border-border flex-shrink-0 hidden sm:block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                      </div>
                      <span className="font-medium line-clamp-2 max-w-[200px]">{p.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{p.category}</td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    <Badge variant={p.condition === "new" ? "success" : "warning"} className="text-micro">
                      {p.condition === "new" ? "New" : "Pre-owned"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold">₦{p.price.toLocaleString("en-NG")}</td>
                  <td className="py-3 px-4 text-right hidden sm:table-cell">
                    <span className={cn("font-medium", p.stock <= 3 ? "text-destructive" : "")}>{p.stock}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button aria-label={p.active ? "Deactivate" : "Activate"}>
                      {p.active ? <ToggleRight className="size-5 text-primary" /> : <ToggleLeft className="size-5 text-muted-foreground" />}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/products/${p.id}`} className="flex size-8 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors" aria-label="Edit">
                        <Edit className="size-4" />
                      </Link>
                      <button className="flex size-8 items-center justify-center rounded-lg border border-border hover:bg-destructive/10 hover:text-destructive transition-colors" aria-label="Delete">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
