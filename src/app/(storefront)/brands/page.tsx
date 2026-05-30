import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck } from "lucide-react";

import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { BrandLogo } from "@/components/storefront/brand-logo";
import { BRANDS, brandHref } from "@/lib/brands";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Shop by Brand — OCare Phinas",
  description:
    "Browse genuine electronics by brand at OCare Phinas — Samsung, Apple, LG, Sony, Panasonic, Binatone and more. Authorised stock, bank transfer payment confirmed manually.",
  openGraph: {
    title: "Shop by Brand — OCare Phinas",
    description:
      "Find your favourite electronics brands in Nigeria. Genuine products, honest prices, nationwide delivery.",
  },
};

const featured = BRANDS.filter((b) => b.featured);
const totalProducts = BRANDS.reduce((sum, b) => sum + b.productCount, 0);

export default function BrandsPage() {
  return (
    <div className="py-8 sm:py-12">
      <Container>
        {/* Heading */}
        <div className="mb-8">
          <nav className="text-caption text-muted-foreground mb-2" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span className="mx-1.5">/</span>
            <span className="text-foreground">Brands</span>
          </nav>
          <p className="text-caption font-semibold uppercase tracking-widest text-primary mb-1">
            Our Brands
          </p>
          <h1 className="text-h1 font-bold">Shop by Brand</h1>
          <p className="text-muted-foreground mt-1 max-w-[52ch]">
            {BRANDS.length} trusted brands and {totalProducts}+ genuine products. Every item is
            sourced from authorised distributors — no fakes, ever.
          </p>
        </div>

        {/* Featured brands */}
        <section aria-labelledby="featured-brands" className="mb-12">
          <h2 id="featured-brands" className="text-h3 font-bold mb-4 flex items-center gap-2">
            <Sparkles className="size-5 text-accent" aria-hidden />
            Featured Brands
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featured.map((brand) => (
              <Link
                key={brand.slug}
                href={brandHref(brand.name)}
                className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-5 overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/40 transition-all duration-300"
              >
                {/* decorative glow */}
                <div
                  aria-hidden
                  className="absolute -right-8 -top-8 size-24 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors"
                />
                <div className="relative flex items-center justify-between mb-8">
                  <div
                    className={cn(
                      "flex h-16 w-28 items-center justify-center rounded-xl p-2.5 transition-colors",
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
                      imgClassName="h-11 w-auto max-w-full"
                      textClassName="text-h3 font-bold text-foreground/70 group-hover:text-primary transition-colors"
                    />
                  </div>
                  <span className="text-micro font-medium text-muted-foreground rounded-full border border-border px-2 py-0.5">
                    {brand.productCount} items
                  </span>
                </div>
                <div className="relative">
                  <h3 className="text-body font-semibold group-hover:text-primary transition-colors">
                    {brand.name}
                  </h3>
                  <p className="text-caption text-muted-foreground mt-0.5">{brand.tagline}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-caption font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Shop {brand.name} <ArrowRight className="size-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* All brands */}
        <section aria-labelledby="all-brands">
          <h2 id="all-brands" className="text-h3 font-bold mb-4">
            All Brands
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {BRANDS.map((brand) => (
              <Link
                key={brand.slug}
                href={brandHref(brand.name)}
                className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-primary/40 hover:bg-primary/5 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200"
              >
                <div
                  className={cn(
                    "flex h-12 w-14 flex-shrink-0 items-center justify-center rounded-lg p-1.5 transition-colors",
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
                    imgClassName="h-8 w-auto max-w-full"
                    textClassName="text-body-sm font-bold text-foreground/70 group-hover:text-primary transition-colors"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-body-sm font-semibold leading-tight truncate group-hover:text-primary transition-colors">
                    {brand.name}
                  </p>
                  <p className="text-micro text-muted-foreground">{brand.productCount} items</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Trust / CTA bar */}
        <div className="mt-12 rounded-2xl border border-primary/20 bg-primary/5 p-8 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-start gap-3">
            <div className="flex size-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <ShieldCheck className="size-6 text-primary" aria-hidden />
            </div>
            <div>
              <h3 className="text-body font-bold mb-0.5">Can&apos;t find your brand?</h3>
              <p className="text-body-sm text-muted-foreground">
                Browse the full catalog or message us on WhatsApp — we source on request.
              </p>
            </div>
          </div>
          <Link href="/products" className={cn(buttonVariants({ size: "lg" }), "gap-2 flex-shrink-0")}>
            Browse all products <ArrowRight className="size-4" />
          </Link>
        </div>
      </Container>
    </div>
  );
}
