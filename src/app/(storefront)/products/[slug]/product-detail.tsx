"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingCart, Minus, Plus, Wallet, ChevronRight, ChevronLeft,
  ShieldCheck, RefreshCw, User, Users, Truck, Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { toast } from "@/store/toastStore";
import { useCartGuard } from "@/hooks/useCartGuard";
import { ProductCard, type ProductCardData } from "@/components/storefront/product-card";
import { isGroupEligible, groupSlotsForPrice, dailyForSlots, naira } from "@/lib/pay-small-small";

export interface ProductDetailData {
  id: string;
  name: string;
  slug: string;
  brand: string;
  categoryName: string | null;
  categorySlug: string | null;
  price: number;
  stockQuantity: number;
  condition: "new" | "pre_owned";
  description: string | null;
  specs: { key: string; value: string }[];
  images: string[];
}

const formatPrice = (n: number) => `₦${n.toLocaleString("en-NG")}`;

function stockLabel(qty: number): "In stock" | "Low stock" | "Out of stock" {
  if (qty <= 0) return "Out of stock";
  if (qty <= 3) return "Low stock";
  return "In stock";
}

export function ProductDetail({ product, related }: { product: ProductDetailData; related: ProductCardData[] }) {
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const addItem = useCartStore((s) => s.addItem);
  const ensureLoggedIn = useCartGuard();

  const outOfStock = product.stockQuantity === 0;
  const lowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;
  const label = stockLabel(product.stockQuantity);
  const images = product.images;
  const imageCount = images.length;
  const mainImage = images[activeImg];

  const groupEligible = isGroupEligible(product.price);
  const groupSlots = groupSlotsForPrice(product.price);
  const groupDaily = dailyForSlots(groupSlots);

  const itemQuery = `productId=${product.id}&item=${product.slug}&name=${encodeURIComponent(product.name)}&price=${product.price}&image=${encodeURIComponent(images[0] ?? "")}`;

  function handleAddToCart() {
    if (!ensureLoggedIn()) return;
    for (let i = 0; i < qty; i++) {
      addItem({ id: product.id, name: product.name, slug: product.slug, price: product.price, image: images[0], stockQuantity: product.stockQuantity });
    }
    toast.success(`${qty} × ${product.name} added to cart`, "Added to cart");
  }

  function stepImage(dir: 1 | -1) {
    if (imageCount > 0) setActiveImg((i) => (i + dir + imageCount) % imageCount);
  }

  return (
    <>
      {/* Breadcrumb */}
      <nav className="text-caption text-muted-foreground mb-6 flex items-center gap-1" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <ChevronRight className="size-3" />
        <Link href={product.categorySlug ? `/category/${product.categorySlug}` : "/products"} className="hover:text-foreground transition-colors capitalize">
          {product.categoryName ?? "Products"}
        </Link>
        <ChevronRight className="size-3" />
        <span className="text-foreground line-clamp-1">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-14">
        {/* Gallery */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            {imageCount > 1 && (
              <div className="flex sm:flex-col gap-2.5 sm:w-20">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={cn(
                      "relative size-16 sm:size-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0",
                      i === activeImg ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50 opacity-70 hover:opacity-100",
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

            <div className="group relative flex-1 aspect-square rounded-2xl overflow-hidden border border-border bg-muted">
              {mainImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={mainImage} alt={product.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground"><Zap className="size-12 opacity-40" /></div>
              )}

              <div className="absolute top-3 left-3">
                {product.condition === "pre_owned" ? (
                  <span className="flex w-fit items-center gap-1 rounded-full bg-accent/90 px-2.5 py-0.5 text-micro font-semibold text-accent-foreground"><RefreshCw className="size-3" /> Pre-owned</span>
                ) : (
                  <span className="w-fit rounded-full bg-primary/90 px-2.5 py-0.5 text-micro font-semibold text-primary-foreground">New</span>
                )}
              </div>

              {imageCount > 1 && (
                <>
                  <button onClick={() => stepImage(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm shadow-sm hover:bg-background transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100" aria-label="Previous image"><ChevronLeft className="size-5" /></button>
                  <button onClick={() => stepImage(1)} className="absolute right-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm shadow-sm hover:bg-background transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100" aria-label="Next image"><ChevronRight className="size-5" /></button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-foreground/70 px-2.5 py-0.5 text-micro font-medium text-background">{activeImg + 1} / {imageCount}</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div>
            <Link href="/brands" className="text-caption font-semibold uppercase tracking-wide text-primary hover:underline">{product.brand}</Link>
            <h1 className="text-h1 font-bold leading-tight mt-1 mb-3">{product.name}</h1>
            <Badge variant={label === "In stock" ? "success" : label === "Low stock" ? "warning" : "destructive"}>{label}</Badge>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <span className="text-display font-bold text-primary leading-none block">{formatPrice(product.price)}</span>
            <p className="text-body-sm text-muted-foreground flex items-center gap-1.5 flex-wrap">
              <Wallet className="size-4 text-accent-foreground" />
              Or spread the cost with <strong className="text-foreground">Pay Small Small</strong> — daily, weekly or monthly
            </p>
            {lowStock && (
              <p className="text-caption font-medium text-foreground flex items-center gap-1.5">
                <span className="inline-block size-1.5 rounded-full bg-warning animate-pulse" />
                Hurry — only {product.stockQuantity} left in stock
              </p>
            )}
          </div>

          {/* Choose how to pay */}
          <div className="space-y-3 pt-1">
            <h2 className="text-body-sm font-semibold">Choose how to pay</h2>

            <div className="rounded-2xl border-2 border-primary/40 bg-card p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10"><ShoppingCart className="size-4 text-primary" /></div>
                  <div>
                    <p className="text-body-sm font-semibold">Outright Purchase</p>
                    <p className="text-caption text-muted-foreground">Pay {formatPrice(product.price)} and get it now</p>
                  </div>
                </div>
                <div className="flex items-center border border-border rounded-lg overflow-hidden flex-shrink-0">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex size-9 items-center justify-center hover:bg-muted transition-colors disabled:opacity-40" aria-label="Decrease quantity" disabled={qty <= 1}><Minus className="size-4" /></button>
                  <span className="w-10 text-center text-body-sm font-semibold">{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(product.stockQuantity, q + 1))} className="flex size-9 items-center justify-center hover:bg-muted transition-colors disabled:opacity-40" aria-label="Increase quantity" disabled={qty >= product.stockQuantity}><Plus className="size-4" /></button>
                </div>
              </div>
              <Button size="lg" className="w-full gap-2" onClick={handleAddToCart} disabled={outOfStock}>
                <ShoppingCart className="size-5" />{outOfStock ? "Out of stock" : "Add to cart"}
              </Button>
            </div>

            <Link href={`/pay-small-small/solo?${itemQuery}`} className="block rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-accent/10"><User className="size-4 text-accent" /></div>
                <div className="flex-1">
                  <p className="text-body-sm font-semibold">Solo Plan</p>
                  <p className="text-caption text-muted-foreground">Pay daily, weekly or monthly · delivered at 50%</p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground flex-shrink-0" />
              </div>
              <p className="text-caption text-muted-foreground flex items-center gap-1.5 pl-11">
                <Truck className="size-3.5 text-primary" />
                Choose your amount and pace; we deliver at 50%, then you finish the balance
              </p>
            </Link>

            {groupEligible && (
              <Link href={`/pay-small-small/join?${itemQuery}`} className="block rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-accent/10"><Users className="size-4 text-accent" /></div>
                  <div className="flex-1">
                    <p className="text-body-sm font-semibold">Group Plan</p>
                    <p className="text-caption text-muted-foreground">{naira(groupDaily)}/day · {groupSlots} slot{groupSlots !== 1 ? "s" : ""} · delivered by group position</p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground flex-shrink-0" />
                </div>
              </Link>
            )}
          </div>

          <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-2">
            <p className="text-body-sm font-semibold flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> How payment works</p>
            <p className="text-caption text-muted-foreground">
              Transfer the exact amount to our bank account, include your order reference in the narration, then send your payment screenshot on WhatsApp. We confirm manually, usually within 2 hours.
            </p>
          </div>
        </div>
      </div>

      {/* Specs + description */}
      <div className="mt-14 max-w-4xl space-y-12">
        {product.specs.length > 0 && (
          <section>
            <h2 className="text-h2 font-bold mb-5">Specifications</h2>
            <div className="rounded-2xl border border-border overflow-hidden">
              <table className="w-full text-body-sm">
                <tbody>
                  {product.specs.map((spec, i) => (
                    <tr key={spec.key} className={cn("border-b border-border last:border-0", i % 2 === 0 ? "bg-muted/30" : "bg-background")}>
                      <td className="py-3 px-4 font-medium text-muted-foreground w-1/3">{spec.key}</td>
                      <td className="py-3 px-4">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {product.description && (
          <section>
            <h2 className="text-h2 font-bold mb-5">Description</h2>
            <p className="text-body text-muted-foreground leading-relaxed whitespace-pre-line">{product.description}</p>
          </section>
        )}
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="text-h2 font-bold mb-6">You may also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      {/* Mobile sticky add-to-cart */}
      <div className="fixed bottom-0 inset-x-0 z-30 lg:hidden border-t border-border bg-background/95 backdrop-blur-md px-4 py-3 flex items-center gap-3">
        <p className="text-h3 font-bold text-primary leading-tight flex-shrink-0">{formatPrice(product.price)}</p>
        <Button size="lg" className="flex-1 gap-2" onClick={handleAddToCart} disabled={outOfStock}>
          <ShoppingCart className="size-5" />{outOfStock ? "Out of stock" : "Add to cart"}
        </Button>
      </div>
    </>
  );
}
