"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Minus,
  Plus,
  MessageCircle,
  Wallet,
  ChevronRight,
  Package,
  RefreshCw,
} from "lucide-react";

import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { toast } from "@/store/toastStore";

/* ------------------------------------------------------------------ */
/* Mock product data — replace with server fetch in Phase 3            */
/* ------------------------------------------------------------------ */
const MOCK_PRODUCT = {
  id: "1",
  name: "Samsung Galaxy S24 Ultra 256GB",
  slug: "samsung-galaxy-s24-ultra-256gb",
  brand: "Samsung",
  category: "Phones",
  categorySlug: "phones",
  price: 65990,
  stockQuantity: 12,
  stockLabel: "In stock" as const,
  condition: "new" as "new" | "pre_owned",
  description:
    "The Samsung Galaxy S24 Ultra sets a new standard for premium smartphones. Featuring the Snapdragon 8 Gen 3 processor, a 200MP camera system with AI-powered photography, and a 5000mAh battery that keeps up with your day. The built-in S Pen makes it the ultimate productivity companion.",
  whatsInBox: ["Galaxy S24 Ultra", "USB-C Cable", "SIM Ejection Pin", "Quick Start Guide"],
  specs: [
    { key: "Display", value: '6.8" Dynamic AMOLED 2X, 120Hz' },
    { key: "Processor", value: "Snapdragon 8 Gen 3" },
    { key: "RAM", value: "12GB" },
    { key: "Storage", value: "256GB" },
    { key: "Main Camera", value: "200MP + 10MP + 12MP + 50MP" },
    { key: "Battery", value: "5000mAh, 45W Fast Charging" },
    { key: "OS", value: "Android 14, One UI 6.1" },
    { key: "5G", value: "Yes" },
    { key: "S Pen", value: "Built-in" },
    { key: "Warranty", value: "1 year Samsung Nigeria warranty" },
  ],
  images: [
    "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&h=800&fit=crop&q=85",
    "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=800&h=800&fit=crop&q=85",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop&q=85",
  ],
};

const RELATED = [
  { id: "2", name: "iPhone 15 Pro Max 256GB", slug: "iphone-15-pro-max", brand: "Apple", price: 89990, stockQuantity: 6, stockLabel: "In stock" as const, categorySlug: "phones", condition: "new" as const, image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop&q=85" },
  { id: "3", name: "iPhone 13 Pro 256GB (UK Used)", slug: "iphone-13-pro-uk-used", brand: "Apple", price: 34990, stockQuantity: 4, stockLabel: "In stock" as const, categorySlug: "phones", condition: "pre_owned" as const, image: "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=400&h=400&fit=crop&q=85" },
];

const PSS_ELIGIBLE_THRESHOLD = 50000;

export default function ProductDetailPage() {
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const addItem = useCartStore((s) => s.addItem);

  const product = MOCK_PRODUCT;
  const outOfStock = product.stockQuantity === 0;
  const isPSSEligible = product.price <= PSS_ELIGIBLE_THRESHOLD * 1.3;

  function handleAddToCart() {
    for (let i = 0; i < qty; i++) {
      addItem({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        image: product.images[0],
        stockQuantity: product.stockQuantity,
      });
    }
    toast.success(`${product.name} added to cart`);
  }

  return (
    <div className="py-8 sm:py-12">
      <Container>
        {/* Breadcrumb */}
        <nav className="text-caption text-muted-foreground mb-6 flex items-center gap-1" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="size-3" />
          <Link href={`/category/${product.categorySlug}`} className="hover:text-foreground transition-colors capitalize">
            {product.category}
          </Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16">
          {/* Image gallery */}
          <div className="space-y-3">
            <div className="relative aspect-square rounded-2xl overflow-hidden border border-border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.images[activeImg]}
                alt={product.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute top-3 left-3 flex gap-2">
                {product.condition === "pre_owned" && (
                  <span className="flex items-center gap-1 rounded-full bg-accent/90 px-2.5 py-0.5 text-micro font-semibold text-accent-foreground">
                    <RefreshCw className="size-3" /> Pre-owned
                  </span>
                )}
                {product.condition === "new" && (
                  <span className="rounded-full bg-primary/90 px-2.5 py-0.5 text-micro font-semibold text-primary-foreground">
                    New
                  </span>
                )}
              </div>
            </div>
            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={cn(
                      "relative size-16 rounded-lg overflow-hidden border-2 transition-colors flex-shrink-0",
                      i === activeImg ? "border-primary" : "border-border hover:border-primary/50",
                    )}
                    aria-label={`View image ${i + 1}`}
                    aria-current={i === activeImg}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <p className="text-caption font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                {product.brand}
              </p>
              <h1 className="text-h1 font-bold leading-tight mb-3">{product.name}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant={
                    product.stockLabel === "In stock"
                      ? "success"
                      : product.stockLabel === "Low stock"
                      ? "warning"
                      : "destructive"
                  }
                >
                  {product.stockLabel}
                </Badge>
              </div>
            </div>

            <p className="text-display font-bold text-primary">
              ₦{product.price.toLocaleString("en-NG")}
            </p>

            {/* Quantity + Add to cart */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-body-sm font-medium">Qty:</span>
                <div className="flex items-center border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="flex size-9 items-center justify-center hover:bg-muted transition-colors"
                    aria-label="Decrease quantity"
                    disabled={qty <= 1}
                  >
                    <Minus className="size-4" />
                  </button>
                  <span className="w-10 text-center text-body-sm font-semibold">{qty}</span>
                  <button
                    onClick={() => setQty((q) => Math.min(product.stockQuantity, q + 1))}
                    className="flex size-9 items-center justify-center hover:bg-muted transition-colors"
                    aria-label="Increase quantity"
                    disabled={qty >= product.stockQuantity}
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full gap-2"
                onClick={handleAddToCart}
                disabled={outOfStock}
              >
                <ShoppingCart className="size-5" />
                {outOfStock ? "Out of stock" : "Add to cart"}
              </Button>

              {isPSSEligible && (
                <Link
                  href={`/pay-small-small/solo?item=${product.slug}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "w-full gap-2",
                  )}
                >
                  <Wallet className="size-5" />
                  Get it on Pay Small Small
                </Link>
              )}
            </div>

            {/* Payment note */}
            <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-2">
              <p className="text-body-sm font-semibold flex items-center gap-2">
                <Package className="size-4 text-primary" /> How payment works
              </p>
              <p className="text-caption text-muted-foreground">
                Transfer the exact amount to our bank account, include your order reference in the narration, then send your payment screenshot on WhatsApp. We confirm manually, usually within 2 hours.
              </p>
              <a
                href="https://wa.me/2340000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-caption text-[#25D366] font-medium hover:underline"
              >
                <MessageCircle className="size-3.5" />
                Chat with us before buying
              </a>
            </div>
          </div>
        </div>

        {/* Specs table */}
        <div className="mt-14">
          <h2 className="text-h2 font-bold mb-6">Specifications</h2>
          <div className="rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-body-sm">
              <tbody>
                {product.specs.map((spec, i) => (
                  <tr
                    key={spec.key}
                    className={cn("border-b border-border last:border-0", i % 2 === 0 ? "bg-muted/30" : "bg-background")}
                  >
                    <td className="py-3 px-4 font-medium text-muted-foreground w-1/3">{spec.key}</td>
                    <td className="py-3 px-4">{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Description */}
        <div className="mt-10">
          <h2 className="text-h2 font-bold mb-4">Description</h2>
          <p className="text-body text-muted-foreground leading-relaxed max-w-3xl">{product.description}</p>
          <div className="mt-4">
            <p className="text-body-sm font-semibold mb-2">What&apos;s in the box:</p>
            <ul className="list-disc list-inside space-y-1">
              {product.whatsInBox.map((item) => (
                <li key={item} className="text-body-sm text-muted-foreground">{item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Related products */}
        {RELATED.length > 0 && (
          <div className="mt-14">
            <h2 className="text-h2 font-bold mb-6">You may also like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {RELATED.map((p) => (
                <Link
                  key={p.id}
                  href={`/products/${p.slug}`}
                  className="group rounded-2xl border border-border bg-card overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-250"
                >
                  <div className="aspect-square relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-3">
                    <p className="text-micro text-muted-foreground font-medium">{p.brand}</p>
                    <p className="text-body-sm font-semibold line-clamp-2 mt-0.5 group-hover:text-primary transition-colors">{p.name}</p>
                    <p className="text-body font-bold text-primary mt-1">₦{p.price.toLocaleString("en-NG")}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
