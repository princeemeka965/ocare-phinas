import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  Banknote,
  HeadphonesIcon,
  ArrowRight,
  Sparkles,
  Wallet,
  Users,
  User,
  ChevronRight,
} from "lucide-react";

import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProductCard, type ProductCardData } from "@/components/storefront/product-card";
import { HeroSection } from "@/components/storefront/hero-section";
import { BrandLogo } from "@/components/storefront/brand-logo";
import { CategoryImage } from "@/components/storefront/category-image";
import { BRANDS, brandHref } from "@/lib/brands";
import { listProducts, listCategories } from "@/lib/server/catalog";
import { categoryPresentation, sortCategoriesForDisplay } from "@/lib/category-presentation";

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

/* Categories and featured products are fetched from the DB in HomePage(). */

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
export default async function HomePage() {
  const [featuredProducts, categories] = await Promise.all([
    listProducts({ instock: "1" }, 8),
    listCategories(),
  ]);
  const hasFeatured = featuredProducts.length > 0;

  return (
    <>
      <HeroSection />
      <PaySmallSmallPromo />
      <CategoryTiles categories={sortCategoriesForDisplay(categories)} />
      <BrandStrip />
      <FeaturedSection hasFeatured={hasFeatured} products={featuredProducts} />
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
              Pick any item. On a solo plan, pay any amount daily, weekly or monthly — delivered at 50%,
              no price cap. Groups cover items up to ₦100,000. No interest, no withdrawals.
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
function CategoryTiles({ categories }: { categories: { name: string; slug: string }[] }) {
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

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4">
          {categories.map((cat) => {
            const { icon: Icon, color, image, tileLabel } = categoryPresentation(cat.slug);
            const label = tileLabel ?? cat.name;
            const isPreowned = cat.slug === "pre-owned";
            return (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className={cn(
                  "group flex flex-col items-center gap-3 rounded-2xl border p-4 sm:p-6 hover:-translate-y-1 hover:shadow-md transition-all duration-250",
                  isPreowned
                    ? "border-accent/30 bg-accent/5 hover:border-accent/50 hover:bg-accent/10"
                    : "border-border bg-card hover:border-primary/40 hover:bg-primary/5",
                )}
              >
                <div className="flex h-12 w-full items-center justify-center">
                  <CategoryImage
                    src={image}
                    alt={label}
                    imgClassName="max-h-full w-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    fallback={
                      <Icon
                        className={cn(
                          "size-10 sm:size-12 transition-transform duration-300 group-hover:scale-110",
                          color,
                        )}
                        aria-hidden
                      />
                    }
                  />
                </div>
                <span className="text-body-sm sm:text-body font-semibold text-center leading-tight">
                  {label}
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

        <div className="grid grid-cols-3 sm:grid-cols-10 gap-2 sm:gap-3">
          {STRIP_BRANDS.map((brand) => (
            <Link
              key={brand.slug}
              href={brandHref(brand.name)}
              className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200 aspect-square p-2.5"
            >
              <div className="flex h-12 w-full sm:h-12 items-center justify-center">
                <BrandLogo
                  name={brand.name}
                  logoSlug={brand.logoSlug}
                  logoUrl={brand.logoUrl}
                  logoUrlDark={brand.logoUrlDark}
                  invertOnDark={brand.invertOnDark}
                  imgClassName="max-h-full w-full max-w-full"
                  textClassName="text-body font-bold text-foreground/70 group-hover:text-primary transition-colors"
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
function FeaturedSection({ hasFeatured, products }: { hasFeatured: boolean; products: ProductCardData[] }) {
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
            {products.map((product) => (
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
