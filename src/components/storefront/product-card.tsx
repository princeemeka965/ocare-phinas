"use client";

import Link from "next/link";
import { ShoppingCart, Zap } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cartStore";
import { toast } from "@/store/toastStore";
import { useCartGuard } from "@/hooks/useCartGuard";

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  stockQuantity: number;
  stockLabel: "In stock" | "Low stock" | "Out of stock";
  categorySlug: string;
  condition?: "new" | "pre_owned";
  badge?: string;
  image?: string;
}

const categoryBg: Record<string, string> = {
  phones:
    "linear-gradient(135deg, oklch(0.52 0.14 195 / 0.18) 0%, oklch(0.6 0.12 180 / 0.25) 100%)",
  laptops:
    "linear-gradient(135deg, oklch(0.5 0.15 240 / 0.18) 0%, oklch(0.55 0.13 250 / 0.25) 100%)",
  tablets:
    "linear-gradient(135deg, oklch(0.55 0.13 165 / 0.18) 0%, oklch(0.58 0.11 150 / 0.25) 100%)",
  audio:
    "linear-gradient(135deg, oklch(0.5 0.15 285 / 0.18) 0%, oklch(0.55 0.13 300 / 0.25) 100%)",
  "home-appliances":
    "linear-gradient(135deg, oklch(0.65 0.15 50 / 0.18) 0%, oklch(0.7 0.13 60 / 0.25) 100%)",
  gaming:
    "linear-gradient(135deg, oklch(0.55 0.18 20 / 0.18) 0%, oklch(0.58 0.15 40 / 0.25) 100%)",
  cameras:
    "linear-gradient(135deg, oklch(0.45 0.04 230 / 0.18) 0%, oklch(0.5 0.03 220 / 0.25) 100%)",
  accessories:
    "linear-gradient(135deg, oklch(0.58 0.14 350 / 0.18) 0%, oklch(0.62 0.12 10 / 0.25) 100%)",
};

const stockVariant: Record<
  ProductCardData["stockLabel"],
  "success" | "warning" | "destructive"
> = {
  "In stock": "success",
  "Low stock": "warning",
  "Out of stock": "destructive",
};

function formatPrice(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const addItem = useCartStore((s) => s.addItem);
  const ensureLoggedIn = useCartGuard();
  const outOfStock = product.stockQuantity === 0;

  function handleAddToCart() {
    if (!ensureLoggedIn()) return;
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.image,
      stockQuantity: product.stockQuantity,
    });
    toast.success(`${product.name} added to cart`, "Added to cart");
  }

  return (
    <article className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
      {/* Image area */}
      <Link
        href={`/products/${product.slug}`}
        className="block relative overflow-hidden"
        aria-label={`View ${product.name}`}
        tabIndex={-1}
      >
        <div
          className="relative h-48 w-full overflow-hidden"
          style={
            !product.image
              ? { background: categoryBg[product.categorySlug] ?? categoryBg.accessories }
              : undefined
          }
        >
          {product.image ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image}
                alt={product.name}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* subtle bottom fade so card content blends cleanly */}
              <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-card/70 to-transparent pointer-events-none" />
            </>
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{ background: categoryBg[product.categorySlug] ?? categoryBg.accessories }}
            >
              <div className="flex flex-col items-center gap-2 opacity-40">
                <Zap className="size-12 text-foreground" aria-hidden />
              </div>
            </div>
          )}
          {product.badge && (
            <span className="absolute top-3 left-3 rounded-full bg-primary px-2.5 py-0.5 text-micro font-semibold text-primary-foreground">
              {product.badge}
            </span>
          )}
          {product.condition && (
            <span
              className={cn(
                "absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-micro font-semibold ring-1",
                product.condition === "new"
                  ? "bg-primary/15 text-primary ring-primary/30"
                  : "bg-accent/15 text-accent-foreground ring-accent/30",
              )}
            >
              {product.condition === "new" ? "New" : "Pre-owned"}
            </span>
          )}
        </div>
      </Link>

      {/* Details */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="flex-1 space-y-1">
          <p className="text-micro text-muted-foreground font-medium uppercase tracking-wide">
            {product.brand}
          </p>
          <Link href={`/products/${product.slug}`}>
            <h3 className="text-body-sm font-semibold leading-snug line-clamp-2 hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-h3 font-bold text-primary">
            {formatPrice(product.price)}
          </span>
          <Badge variant={stockVariant[product.stockLabel]} className="text-micro">
            {product.stockLabel}
          </Badge>
        </div>

        <Button
          size="sm"
          className="w-full gap-2 !py-5"
          onClick={handleAddToCart}
          disabled={outOfStock}
          aria-label={
            outOfStock
              ? `${product.name} is out of stock`
              : `Add ${product.name} to cart`
          }
        >
          <ShoppingCart className="size-3.5" />
          {outOfStock ? "Out of stock" : "Add to cart"}
        </Button>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card overflow-hidden">
      <div className="h-48 bg-muted animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="space-y-1.5">
          <div className="h-3 w-16 bg-muted rounded animate-pulse" />
          <div className="h-4 w-full bg-muted rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-6 w-24 bg-muted rounded animate-pulse" />
          <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
        </div>
        <div className="h-8 w-full bg-muted rounded-lg animate-pulse" />
      </div>
    </div>
  );
}
