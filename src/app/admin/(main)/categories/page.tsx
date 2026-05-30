import type { Metadata } from "next";
import { Plus, Edit, Trash2, AlertTriangle } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Categories & Brands — OCare Phinas Admin" };

const CATEGORIES = [
  { id: "1", name: "Phones", slug: "phones", productCount: 45 },
  { id: "2", name: "Laptops", slug: "laptops", productCount: 23 },
  { id: "3", name: "Audio", slug: "audio", productCount: 18 },
  { id: "4", name: "Home Appliances", slug: "appliances", productCount: 67 },
  { id: "5", name: "Accessories", slug: "accessories", productCount: 34 },
  { id: "6", name: "Gaming", slug: "gaming", productCount: 9 },
  { id: "7", name: "Cameras", slug: "cameras", productCount: 7 },
  { id: "8", name: "Pre-owned (Tokunbo / UK Used)", slug: "pre-owned", productCount: 28 },
];

const BRANDS = [
  { id: "1", name: "LG", slug: "lg", productCount: 22 },
  { id: "2", name: "Samsung", slug: "samsung", productCount: 35 },
  { id: "3", name: "Sony", slug: "sony", productCount: 14 },
  { id: "4", name: "Mewe", slug: "mewe", productCount: 8 },
  { id: "5", name: "Iwin", slug: "iwin", productCount: 5 },
  { id: "6", name: "Binatone", slug: "binatone", productCount: 18 },
  { id: "7", name: "Ambiano", slug: "ambiano", productCount: 11 },
  { id: "8", name: "Tower", slug: "tower", productCount: 7 },
  { id: "9", name: "Silvercrest", slug: "silvercrest", productCount: 9 },
  { id: "10", name: "Panasonic", slug: "panasonic", productCount: 16 },
];

function DataTable({ rows }: { rows: { id: string; name: string; slug: string; productCount: number }[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <table className="w-full text-body-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Name</th>
            <th className="text-left py-3 px-4 font-semibold text-muted-foreground hidden sm:table-cell">Slug</th>
            <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Products</th>
            <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-muted/30 transition-colors">
              <td className="py-3 px-4 font-medium">{row.name}</td>
              <td className="py-3 px-4 text-muted-foreground font-mono text-caption hidden sm:table-cell">{row.slug}</td>
              <td className="py-3 px-4 text-right text-muted-foreground">{row.productCount}</td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-2">
                  <button className="flex size-8 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"><Edit className="size-4" /></button>
                  <button disabled={row.productCount > 0} title={row.productCount > 0 ? "Has products — cannot delete" : "Delete"}
                    className="flex size-8 items-center justify-center rounded-lg border border-border hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-30">
                    {row.productCount > 0 ? <AlertTriangle className="size-4 text-muted-foreground" /> : <Trash2 className="size-4" />}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <div className="space-y-10">
      <h1 className="text-h1 font-bold">Categories & Brands</h1>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-h2 font-bold">Categories</h2>
          <button className={cn(buttonVariants(), "gap-2")}><Plus className="size-4" /> Add category</button>
        </div>
        <DataTable rows={CATEGORIES} />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-h2 font-bold">Brands</h2>
          <button className={cn(buttonVariants(), "gap-2")}><Plus className="size-4" /> Add brand</button>
        </div>
        <p className="text-body-sm text-muted-foreground -mt-2">Pre-seeded: LG, Samsung, Sony, Mewe, Iwin, Binatone, Ambiano, Tower, Silvercrest, Panasonic.</p>
        <DataTable rows={BRANDS} />
      </div>
    </div>
  );
}
