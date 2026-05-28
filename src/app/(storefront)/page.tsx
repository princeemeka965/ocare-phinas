import type { Metadata } from "next";
import Link from "next/link";
import {
  Smartphone,
  Laptop,
  Headphones,
  Tv,
  Cable,
  Camera,
  Gamepad2,
  TabletSmartphone,
  ShieldCheck,
  Truck,
  Banknote,
  HeadphonesIcon,
  ArrowRight,
  Sparkles,
} from "lucide-react";

import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ProductCard,
  type ProductCardData,
} from "@/components/storefront/product-card";
import { HeroSection } from "@/components/storefront/hero-section";

export const metadata: Metadata = {
  title: "OCare Phinas — Electronics Store Nigeria",
  description:
    "Shop genuine electronics in Nigeria. Phones, laptops, audio, appliances and more. Bank transfer payment with manual confirmation.",
  openGraph: {
    title: "OCare Phinas — Electronics Store Nigeria",
    description:
      "Genuine gadgets. Transparent pricing. Hassle-free delivery across Nigeria.",
  },
};

/* ------------------------------------------------------------------ */
/* Mock data — replace with server fetch in Phase 3                     */
/* ------------------------------------------------------------------ */
const FEATURED_PRODUCTS: ProductCardData[] = [
  {
    id: "1",
    name: "Samsung Galaxy S24 Ultra 256GB",
    slug: "samsung-galaxy-s24-ultra-256gb",
    brand: "Samsung",
    price: 65990,
    stockQuantity: 12,
    stockLabel: "In stock",
    categorySlug: "phones",
    badge: "Bestseller",
    image:
      "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&h=600&fit=crop&q=85",
  },
  {
    id: "2",
    name: "Apple MacBook Air 13-inch M3",
    slug: "apple-macbook-air-13-m3",
    brand: "Apple",
    price: 79990,
    stockQuantity: 5,
    stockLabel: "Low stock",
    categorySlug: "laptops",
    badge: "New",
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=600&fit=crop&q=85",
  },
  {
    id: "3",
    name: "Sony WH-1000XM5 Wireless Headphones",
    slug: "sony-wh-1000xm5",
    brand: "Sony",
    price: 22990,
    stockQuantity: 8,
    stockLabel: "In stock",
    categorySlug: "audio",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop&q=85",
  },
  {
    id: "4",
    name: 'LG OLED evo C3 55" 4K Smart TV',
    slug: "lg-oled-evo-55-c3",
    brand: "LG",
    price: 89990,
    stockQuantity: 3,
    stockLabel: "Low stock",
    categorySlug: "appliances",
    image:
      "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&h=600&fit=crop&q=85",
  },
];

const CATEGORIES = [
  { name: "Phones", slug: "phones", icon: Smartphone, color: "text-cyan-500" },
  { name: "Laptops", slug: "laptops", icon: Laptop, color: "text-blue-500" },
  { name: "Tablets", slug: "tablets", icon: TabletSmartphone, color: "text-emerald-500" },
  { name: "Audio", slug: "audio", icon: Headphones, color: "text-purple-500" },
  { name: "Appliances", slug: "appliances", icon: Tv, color: "text-orange-500" },
  { name: "Accessories", slug: "accessories", icon: Cable, color: "text-rose-500" },
  { name: "Gaming", slug: "gaming", icon: Gamepad2, color: "text-red-500" },
  { name: "Cameras", slug: "cameras", icon: Camera, color: "text-slate-500" },
];

const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    title: "100% Genuine",
    description: "Every product is sourced from authorised distributors. No fakes, ever.",
  },
  {
    icon: Banknote,
    title: "Secure Bank Transfer",
    description: "We confirm all transfers manually within 2 hours — no surprises.",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "Nationwide shipping. Your order dispatched the same day we confirm payment.",
  },
  {
    icon: HeadphonesIcon,
    title: "Personal Support",
    description: "Chat with us on WhatsApp before and after your purchase.",
  },
];

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
export default function HomePage() {
  const hasFeatured = FEATURED_PRODUCTS.length > 0;

  return (
    <>
      <HeroSection />
      <CategoryTiles />
      <FeaturedSection hasFeatured={hasFeatured} />
      <TrustStrip />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Category tiles                                                       */
/* ------------------------------------------------------------------ */
function CategoryTiles() {
  return (
    <section
      id="categories"
      aria-labelledby="categories-heading"
      className="py-14 sm:py-16 bg-background"
    >
      <Container>
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-caption font-semibold uppercase tracking-widest text-primary mb-1">
              Browse
            </p>
            <h2 id="categories-heading" className="text-h2 font-bold">
              Shop by Category
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-4 sm:p-5 hover:border-primary/40 hover:bg-primary/5 hover:-translate-y-1 hover:shadow-md transition-all duration-250"
              >
                <div className="flex size-12 sm:size-14 items-center justify-center rounded-xl bg-muted group-hover:bg-primary/10 transition-colors duration-250">
                  <Icon
                    className={cn(
                      "size-6 sm:size-7 transition-transform duration-300 group-hover:scale-110",
                      cat.color,
                    )}
                    aria-hidden
                  />
                </div>
                <span className="text-caption font-semibold text-center leading-tight">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Featured products                                                    */
/* ------------------------------------------------------------------ */
function FeaturedSection({ hasFeatured }: { hasFeatured: boolean }) {
  return (
    <section
      aria-labelledby="featured-heading"
      className="py-14 sm:py-16 bg-muted/40"
    >
      <Container>
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-caption font-semibold uppercase tracking-widest text-primary mb-1">
              Handpicked
            </p>
            <h2 id="featured-heading" className="text-h2 font-bold">
              Featured Products
            </h2>
          </div>
          {hasFeatured && (
            <Link
              href="/products"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "gap-1.5 text-primary hover:text-primary",
              )}
            >
              View all <ArrowRight className="size-3.5" />
            </Link>
          )}
        </div>

        {hasFeatured ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURED_PRODUCTS.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-border bg-card">
            <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Sparkles className="size-8 text-muted-foreground" aria-hidden />
            </div>
            <h3 className="text-h3 font-semibold mb-2">Coming Soon</h3>
            <p className="text-body-sm text-muted-foreground max-w-[32ch]">
              We&apos;re stocking up our shelves with the best electronics.
              Check back very soon!
            </p>
          </div>
        )}
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Trust strip                                                          */
/* ------------------------------------------------------------------ */
function TrustStrip() {
  return (
    <section
      aria-labelledby="trust-heading"
      className="py-14 sm:py-16 bg-background"
    >
      <Container>
        <div className="text-center mb-10">
          <p className="text-caption font-semibold uppercase tracking-widest text-primary mb-1">
            Why Us
          </p>
          <h2 id="trust-heading" className="text-h2 font-bold">
            Why Shop With OCare Phinas
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TRUST_POINTS.map((point) => {
            const Icon = point.icon;
            return (
              <div
                key={point.title}
                className="flex flex-col items-center text-center p-6 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 mb-4 group-hover:bg-primary/15 transition-colors">
                  <Icon className="size-7 text-primary" aria-hidden />
                </div>
                <h3 className="text-body font-semibold mb-2">{point.title}</h3>
                <p className="text-body-sm text-muted-foreground leading-relaxed">
                  {point.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA bar */}
        <div className="mt-12 rounded-2xl border border-primary/20 bg-primary/5 p-8 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div>
            <h3 className="text-h3 font-bold mb-1">Ready to shop?</h3>
            <p className="text-body-sm text-muted-foreground">
              Browse our full catalog and find your next favourite gadget.
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Link
              href="/category/phones"
              className={cn(buttonVariants({ size: "lg" }), "gap-2 text-white")}
            >
              Shop Now <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/how-to-pay"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              How to Pay
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
