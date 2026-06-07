import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "Add Product — OCare Phinas Admin" };

export default function NewProductPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2")}>
          <ArrowLeft className="size-4" /> Products
        </Link>
        <h1 className="text-h1 font-bold">Add Product</h1>
      </div>
      <ProductForm />
    </div>
  );
}
