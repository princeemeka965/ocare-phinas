"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { ProductForm, type ProductFormValues } from "../product-form";

interface ApiProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stockQuantity: number;
  condition: "new" | "used";
  categoryId: string | null;
  brandId: string | null;
  images: string[];
  specs: Record<string, string> | null;
  active: boolean;
}

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [values, setValues] = useState<ProductFormValues | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get<{ product: ApiProduct }>(`/api/admin/products/${id}`)
      .then((d) => {
        const p = d.product;
        setValues({
          id: p.id,
          name: p.name,
          description: p.description ?? "",
          price: p.price,
          stockQuantity: p.stockQuantity,
          condition: p.condition,
          categoryId: p.categoryId,
          brandId: p.brandId,
          images: p.images ?? [],
          specs: p.specs,
          active: p.active,
        });
      })
      .catch(() => setError(true));
  }, [id]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2")}>
          <ArrowLeft className="size-4" /> Products
        </Link>
        <h1 className="text-h1 font-bold">Edit Product</h1>
      </div>

      {error ? (
        <p className="text-body-sm text-muted-foreground">Product not found.</p>
      ) : !values ? (
        <div className="flex items-center gap-2 text-muted-foreground py-12"><Loader2 className="size-5 animate-spin" /> Loading…</div>
      ) : (
        <ProductForm product={values} />
      )}
    </div>
  );
}
