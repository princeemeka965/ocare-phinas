"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Minus,
  Plus,
  Wallet,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  RefreshCw,
  Check,
  User,
  Users,
  Truck,
} from "lucide-react";

import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { toast } from "@/store/toastStore";
import { ProductCard } from "@/components/storefront/product-card";
import { planMath, isGroupEligible, groupSlotsForPrice, dailyForSlots, naira } from "@/lib/pay-small-small";

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
  highlights: [
    '6.8" Dynamic AMOLED 2X, 120Hz display',
    "200MP AI camera system",
    "Snapdragon 8 Gen 3 · 12GB RAM",
    "5000mAh battery, 45W fast charging",
    "Built-in S Pen",
  ],
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
  { id: "4", name: "Sony WH-1000XM5 Headphones", slug: "sony-wh-1000xm5", brand: "Sony", price: 22990, stockQuantity: 9, stockLabel: "In stock" as const, categorySlug: "audio", condition: "new" as const, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop&q=85" },
  { id: "5", name: 'MacBook Air 13" M3 256GB', slug: "macbook-air-m3", brand: "Apple", price: 119990, stockQuantity: 3, stockLabel: "Low stock" as const, categorySlug: "laptops", condition: "new" as const, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop&q=85" },
];

function formatPrice(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

export default function ProductDetailPage() {
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const addItem = useCartStore((s) => s.addItem);

  const product = MOCK_PRODUCT;
  const outOfStock = product.stockQuantity === 0;
  const lowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;
  const imageCount = product.images.length;

  /* Pay Small Small — slot engine (locked rules in src/lib/pay-small-small.ts).
     Solo & Outright have no price cap; Group only for items ≤ ₦100,000. */
  const pss = planMath(product.price);
  const groupEligible = isGroupEligible(product.price);
  const groupSlots = groupSlotsForPrice(product.price);
  const groupDaily = dailyForSlots(groupSlots);

  /* Deep-link query carrying the chosen item into the plan builders. */
  const itemQuery = `item=${product.slug}&name=${encodeURIComponent(product.name)}&price=${product.price}&image=${encodeURIComponent(product.images[0])}`;

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
    toast.success(`${qty} × ${product.name} added to cart`, "Added to cart");
  }

  function stepImage(dir: 1 | -1) {
    setActiveImg((i) => (i + dir + imageCount) % imageCount);
  }

  return (
    <div className="py-6 sm:py-10 pb-24 lg:pb-12">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-14">
          {/* ---------------- Image gallery (sticky on desktop) ---------------- */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              {/* Thumbnails */}
              {imageCount > 1 && (
                <div className="flex sm:flex-col gap-2.5 sm:w-20">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={cn(
                        "relative size-16 sm:size-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0",
                        i === activeImg
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-primary/50 opacity-70 hover:opacity-100",
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

              {/* Main image */}
              <div className="group relative flex-1 aspect-square rounded-2xl overflow-hidden border border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.images[activeImg]}
                  alt={product.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {/* Condition badge */}
                <div className="absolute top-3 left-3">
                  {product.condition === "pre_owned" ? (
                    <span className="flex w-fit items-center gap-1 rounded-full bg-accent/90 px-2.5 py-0.5 text-micro font-semibold text-accent-foreground">
                      <RefreshCw className="size-3" /> Pre-owned
                    </span>
                  ) : (
                    <span className="w-fit rounded-full bg-primary/90 px-2.5 py-0.5 text-micro font-semibold text-primary-foreground">
                      New
                    </span>
                  )}
                </div>

                {/* Nav arrows */}
                {imageCount > 1 && (
                  <>
                    <button
                      onClick={() => stepImage(-1)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm shadow-sm hover:bg-background transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="size-5" />
                    </button>
                    <button
                      onClick={() => stepImage(1)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm shadow-sm hover:bg-background transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      aria-label="Next image"
                    >
                      <ChevronRight className="size-5" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-foreground/70 px-2.5 py-0.5 text-micro font-medium text-background">
                      {activeImg + 1} / {imageCount}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ---------------- Details ---------------- */}
          <div className="space-y-5">
            <div>
              <Link
                href={`/brands`}
                className="text-caption font-semibold uppercase tracking-wide text-primary hover:underline"
              >
                {product.brand}
              </Link>
              <h1 className="text-h1 font-bold leading-tight mt-1 mb-3">{product.name}</h1>

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

            {/* Price block */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <span className="text-display font-bold text-primary leading-none block">
                {formatPrice(product.price)}
              </span>

              <p className="text-body-sm text-muted-foreground flex items-center gap-1.5 flex-wrap">
                <Wallet className="size-4 text-accent-foreground" />
                Or pay{" "}
                <strong className="text-foreground">{naira(pss.daily)}/day</strong> with Pay Small Small
                {" "}({pss.slots} slot{pss.slots !== 1 ? "s" : ""})
              </p>

              {lowStock && (
                <p className="text-caption font-medium text-foreground flex items-center gap-1.5">
                  <span className="inline-block size-1.5 rounded-full bg-warning animate-pulse" />
                  Hurry — only {product.stockQuantity} left in stock
                </p>
              )}
            </div>

            {/* Highlights */}
            {product.highlights.length > 0 && (
              <div>
                <h2 className="text-body-sm font-semibold mb-2">Key highlights</h2>
                <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5">
                  {product.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2 text-body-sm text-muted-foreground">
                      <Check className="size-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Choose how to pay — Outright / Solo / Group (payment-flow §2) */}
            <div className="space-y-3 pt-1">
              <h2 className="text-body-sm font-semibold">Choose how to pay</h2>

              {/* Outright Purchase */}
              <div className="rounded-2xl border-2 border-primary/40 bg-card p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
                      <ShoppingCart className="size-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-body-sm font-semibold">Outright Purchase</p>
                      <p className="text-caption text-muted-foreground">Pay {formatPrice(product.price)} and get it now</p>
                    </div>
                  </div>
                  <div className="flex items-center border border-border rounded-lg overflow-hidden flex-shrink-0">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="flex size-9 items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
                      aria-label="Decrease quantity"
                      disabled={qty <= 1}
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="w-10 text-center text-body-sm font-semibold">{qty}</span>
                    <button
                      onClick={() => setQty((q) => Math.min(product.stockQuantity, q + 1))}
                      className="flex size-9 items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
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
              </div>

              {/* Solo Plan */}
              <Link
                href={`/pay-small-small/solo?${itemQuery}`}
                className="block rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-accent/10">
                    <User className="size-4 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-body-sm font-semibold">Solo Plan</p>
                    <p className="text-caption text-muted-foreground">
                      {naira(pss.daily)}/day · {pss.slots} slot{pss.slots !== 1 ? "s" : ""} · delivered at 50%
                    </p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground flex-shrink-0" />
                </div>
                <p className="text-caption text-muted-foreground flex items-center gap-1.5 pl-11">
                  <Truck className="size-3.5 text-primary" />
                  Get it in ~{pss.daysToDelivery} days, then finish the balance
                </p>
              </Link>

              {/* Group Plan — eligible only for items ≤ ₦100,000 */}
              {groupEligible && (
                <Link
                  href={`/pay-small-small/join?${itemQuery}`}
                  className="block rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-accent/10">
                      <Users className="size-4 text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="text-body-sm font-semibold">Group Plan</p>
                      <p className="text-caption text-muted-foreground">
                        {naira(groupDaily)}/day · {groupSlots} slot{groupSlots !== 1 ? "s" : ""} · delivered by group position
                      </p>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </Link>
              )}
            </div>

            {/* Payment note */}
            <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-2">
              <p className="text-body-sm font-semibold flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" /> How payment works
              </p>
              <p className="text-caption text-muted-foreground">
                Transfer the exact amount to our bank account, include your order reference in the narration, then send your payment screenshot on WhatsApp. We confirm manually, usually within 2 hours.
              </p>
            </div>
          </div>
        </div>

        {/* ---------------- Product information ---------------- */}
        <div className="mt-14 max-w-4xl space-y-12">
          {/* Specifications */}
          <section>
            <h2 className="text-h2 font-bold mb-5">Specifications</h2>
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
          </section>

          {/* Description */}
          <section>
            <h2 className="text-h2 font-bold mb-5">Description</h2>
            <p className="text-body text-muted-foreground leading-relaxed">{product.description}</p>
          </section>

          {/* What's in the box */}
          <section>
            <h2 className="text-h2 font-bold mb-5">What&apos;s in the box</h2>
            <ul className="space-y-2">
              {product.whatsInBox.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-body-sm">
                  <Check className="size-4 text-primary flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* ---------------- Related products ---------------- */}
        {RELATED.length > 0 && (
          <div className="mt-16">
            <h2 className="text-h2 font-bold mb-6">You may also like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {RELATED.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </Container>

      {/* ---------------- Mobile sticky add-to-cart bar ---------------- */}
      <div className="fixed bottom-0 inset-x-0 z-30 lg:hidden border-t border-border bg-background/95 backdrop-blur-md px-4 py-3 flex items-center gap-3">
        <p className="text-h3 font-bold text-primary leading-tight flex-shrink-0">
          {formatPrice(product.price)}
        </p>
        <Button
          size="lg"
          className="flex-1 gap-2"
          onClick={handleAddToCart}
          disabled={outOfStock}
        >
          <ShoppingCart className="size-5" />
          {outOfStock ? "Out of stock" : "Add to cart"}
        </Button>
      </div>
    </div>
  );
}
