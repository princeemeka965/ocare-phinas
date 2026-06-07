import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProductsTable } from "./products-table";

export const metadata: Metadata = { title: "Products — OCare Phinas Admin" };

export default function AdminProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-h1 font-bold">Products</h1>
        <Link href="/admin/products/new" className={cn(buttonVariants(), "gap-2")}>
          <Plus className="size-4" /> Add product
        </Link>
      </div>
      <ProductsTable />
    </div>
  );
}
