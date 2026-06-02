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
  Wallet,
  Users,
  User,
  RefreshCw,
  ChevronRight,
} from "lucide-react";

import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ProductCard,
  type ProductCardData,
} from "@/components/storefront/product-card";
import { HeroSection } from "@/components/storefront/hero-section";
import { BrandLogo } from "@/components/storefront/brand-logo";
import { BRANDS, brandHref } from "@/lib/brands";

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
    condition: "new",
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
    condition: "new",
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
    condition: "new",
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
    condition: "new",
    image:
      "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&h=600&fit=crop&q=85",
  },
  {
    id: "5",
    name: "iPhone 13 Pro 256GB (UK Used)",
    slug: "iphone-13-pro-256gb-uk-used",
    brand: "Apple",
    price: 34990,
    stockQuantity: 4,
    stockLabel: "In stock",
    categorySlug: "phones",
    condition: "pre_owned",
    image:
      "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=800&h=600&fit=crop&q=85",
  },
  {
    id: "6",
    name: "Dell XPS 13 Laptop (Tokunbo)",
    slug: "dell-xps-13-tokunbo",
    brand: "Dell",
    price: 38500,
    stockQuantity: 2,
    stockLabel: "Low stock",
    categorySlug: "laptops",
    condition: "pre_owned",
    image:
      "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&h=600&fit=crop&q=85",
  },
  {
    id: "7",
    name: "Binatone Standing Fan 16-inch",
    slug: "binatone-standing-fan-16",
    brand: "Binatone",
    price: 12500,
    stockQuantity: 20,
    stockLabel: "In stock",
    categorySlug: "appliances",
    condition: "new",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&q=85",
  },
  {
    id: "8",
    name: "Panasonic Microwave Oven 20L",
    slug: "panasonic-microwave-20l",
    brand: "Panasonic",
    price: 18900,
    stockQuantity: 7,
    stockLabel: "In stock",
    categorySlug: "appliances",
    condition: "new",
    image:
      "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800&h=600&fit=crop&q=85",
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
  { name: "Pre-owned (Tokunbo)", slug: "pre-owned", icon: RefreshCw, color: "text-amber-500" },
];

/* Curated brand strip for the homepage — full catalog lives in @/lib/brands */
const STRIP_BRAND_SLUGS = [
  "lg",
  "samsung",
  "sony",
  "mewe",
  "iwin",
  "binatone",
  "ambiano",
  "tower",
  "silvercrest",
  "panasonic",
];
const STRIP_BRANDS = STRIP_BRAND_SLUGS.map(
  (slug) => BRANDS.find((b) => b.slug === slug)!,
).filter(Boolean);

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
      <PaySmallSmallPromo />
      <CategoryTiles />
      <BrandStrip />
      <FeaturedSection hasFeatured={hasFeatured} />
      <TrustStrip />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Pay Small Small promo block (A1 spec)                               */
/* ------------------------------------------------------------------ */
function PaySmallSmallPromo() {
  return (
    <section
      aria-labelledby="pss-heading"
      className="py-14 sm:py-16 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.50 0.15 150) 0%, oklch(0.45 0.14 150) 50%, oklch(0.55 0.14 100) 100%)",
      }}
    >
      {/* decorative gold glow */}
      <div
        aria-hidden
        className="absolute -right-20 -top-20 size-72 rounded-full opacity-20 blur-3xl"
        style={{ background: "oklch(0.72 0.17 78)" }}
      />
      <div
        aria-hidden
        className="absolute -left-10 -bottom-10 size-48 rounded-full opacity-15 blur-2xl"
        style={{ background: "oklch(0.72 0.17 78)" }}
      />

      <Container className="relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-10">
          {/* Text */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 mb-5 backdrop-blur-sm">
              <Sparkles className="size-3.5 text-yellow-300" aria-hidden />
              <span className="text-caption font-medium text-white/90">
                Save daily, own it sooner
              </span>
            </div>
            <h2
              id="pss-heading"
              className="font-bold text-white mb-4"
              style={{ fontSize: "clamp(1.6rem, 2.5vw + 1rem, 2.4rem)", lineHeight: 1.15 }}
            >
              Pay Small Small —{" "}
              <span
                style={{
                  background: "linear-gradient(90deg, oklch(0.88 0.15 80), oklch(0.95 0.12 90))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Own It the Easy Way
              </span>
            </h2>
            <p className="text-body-lg text-white/80 mb-8 max-w-[42ch] mx-auto lg:mx-0">
              Pick any item and pay ₦1,000 a day per slot. Solo plans deliver at 50% with no price cap;
              groups cover items up to ₦100,000. No interest, no withdrawals.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                href="/pay-small-small/solo"
                className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg font-semibold text-body text-primary bg-white hover:bg-white/90 transition-colors"
              >
                <User className="size-4" /> Start a Solo Plan
              </Link>
              <Link
                href="/pay-small-small/join"
                className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg font-semibold text-body text-white border border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
              >
                <Users className="size-4" /> Join a Group
              </Link>
            </div>
            <p className="mt-5 text-caption text-white/50">
              Joining is completely optional — you can always shop normally without a plan.
            </p>
          </div>

          {/* Stats cards */}
          <div className="flex-shrink-0 grid grid-cols-2 gap-3 w-full max-w-xs lg:max-w-[280px]">
            {[
              { value: "Any item", label: "no price cap" },
              { value: "You set", label: "the amount" },
              { value: "Daily/wkly/mthly", label: "your schedule" },
              { value: "50% paid", label: "we deliver" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm px-4 py-4 text-center"
              >
                <p className="text-h3 font-bold text-white">{s.value}</p>
                <p className="text-caption text-white/60 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
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
          <Link
            href="/products"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-1.5 text-primary hover:text-primary",
            )}
          >
            View all <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isPreowned = cat.slug === "pre-owned";
            return (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className={cn(
                  "group flex flex-col items-center gap-2.5 rounded-2xl border p-3 sm:p-4 hover:-translate-y-1 hover:shadow-md transition-all duration-250",
                  isPreowned
                    ? "border-accent/30 bg-accent/5 hover:border-accent/50 hover:bg-accent/10"
                    : "border-border bg-card hover:border-primary/40 hover:bg-primary/5",
                )}
              >
                <div
                  className={cn(
                    "flex size-10 sm:size-12 items-center justify-center rounded-xl transition-colors duration-250",
                    isPreowned
                      ? "bg-accent/10 group-hover:bg-accent/20"
                      : "bg-muted group-hover:bg-primary/10",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-5 sm:size-6 transition-transform duration-300 group-hover:scale-110",
                      cat.color,
                    )}
                    aria-hidden
                  />
                </div>
                <span className="text-micro font-semibold text-center leading-tight">
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
/* Shop by Brand strip (A1 spec)                                       */
/* ------------------------------------------------------------------ */
function BrandStrip() {
  return (
    <section
      aria-labelledby="brands-heading"
      className="py-10 sm:py-12 bg-muted/30 border-y border-border"
    >
      <Container>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-caption font-semibold uppercase tracking-widest text-primary mb-1">
              Our Brands
            </p>
            <h2 id="brands-heading" className="text-h2 font-bold">
              Shop by Brand
            </h2>
          </div>
          <Link
            href="/brands"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-1.5 text-primary hover:text-primary",
            )}
          >
            All brands <ChevronRight className="size-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-3">
          {STRIP_BRANDS.map((brand) => (
            <Link
              key={brand.slug}
              href={brandHref(brand.name)}
              className="group flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200 aspect-square p-3"
            >
              <div
                className={cn(
                  "flex h-10 w-full sm:h-12 items-center justify-center rounded-lg p-1.5 transition-colors",
                  brand.darkChip
                    ? "bg-neutral-800"
                    : "bg-muted group-hover:bg-primary/10",
                )}
              >
                <BrandLogo
                  name={brand.name}
                  logoSlug={brand.logoSlug}
                  logoUrl={brand.logoUrl}
                  invertOnDark={brand.invertOnDark}
                  imgClassName="h-7 sm:h-9 w-auto max-w-full"
                  textClassName="text-body-sm sm:text-body font-bold text-foreground/70 group-hover:text-primary transition-colors"
                />
              </div>
              <span className="text-micro font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">
                {brand.name}
              </span>
            </Link>
          ))}
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
      className="py-14 sm:py-16 bg-background"
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
            {FEATURED_PRODUCTS.slice(0, 8).map((product) => (
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
              We&apos;re stocking up our shelves with the best electronics. Check back very soon!
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
      className="py-14 sm:py-16 bg-muted/40"
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
              Browse our full catalog — new electronics and genuine pre-owned items.
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0 flex-wrap justify-center">
            <Link
              href="/products"
              className={cn(buttonVariants({ size: "lg" }), "gap-2")}
            >
              Shop Now <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/pay-small-small"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "gap-2")}
            >
              <Wallet className="size-4" /> Pay Small Small
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
