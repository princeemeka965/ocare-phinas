"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

/**
 * Replace these with your own lifestyle photography showing real customers
 * and products. Recommended: 1920×1080, high contrast, people-focused.
 * Each slide has a headline override so you can tailor the copy per image.
 */
const SLIDES = [
  {
    // Person browsing electronics / walking through a store
    src: "https://images.unsplash.com/photo-1741992556911-f04553890e36?w=1920&h=1080&fit=crop&q=85",
    alt: "Shopping for electronics",
    headline: (
      <>
        Shop the{" "}
        <span className="hero-gradient-text">Latest Electronics</span>{" "}
        in Nigeria
      </>
    ),
  },
  {
    // Person using a laptop / working with tech
    src: "https://images.unsplash.com/photo-1508780709619-79562169bc64?w=1920&h=1080&fit=crop&q=85",
    alt: "Using modern technology",
    headline: (
      <>
        <span className="hero-gradient-text">Genuine Gadgets,</span>
        <br />
        Honest Prices
      </>
    ),
  },
  {
    // Person with headphones / audio gear
    src: "https://images.unsplash.com/photo-1661983228625-f4619e57f66b?w=1920&h=1080&fit=crop&q=85",
    alt: "Premium audio equipment",
    headline: (
      <>
        Sound, Vision &{" "}
        <span className="hero-gradient-text">Everything</span>
        <br />
        in Between
      </>
    ),
  },
];

const INTERVAL = 6000;

export function HeroSection() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setActive((c) => (c + 1) % SLIDES.length), []);
  const prev = useCallback(
    () => setActive((c) => (c - 1 + SLIDES.length) % SLIDES.length),
    [],
  );

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, INTERVAL);
    return () => clearInterval(id);
  }, [paused, next]);

  return (
    <section
      aria-label="Welcome to OCare Phinas"
      className="relative flex items-center overflow-hidden"
      style={{ minHeight: "clamp(560px, 88vh, 760px)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── Background slides ── */}
      {SLIDES.map((slide, i) => (
        <div
          key={slide.src}
          aria-hidden
          className={cn(
            "absolute inset-0 transition-opacity duration-1000 ease-in-out",
            i === active ? "opacity-100" : "opacity-0",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.src}
            alt=""
            className="h-full w-full object-cover"
            loading={i === 0 ? "eager" : "lazy"}
          />
        </div>
      ))}

      {/* ── Layered dark overlay ── */}
      {/* Left-heavy gradient so text stays legible on any photo */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(100deg, oklch(0.09 0.025 230 / 0.97) 0%, oklch(0.11 0.035 215 / 0.85) 40%, oklch(0.1 0.03 210 / 0.55) 70%, oklch(0.1 0.03 210 / 0.3) 100%)",
        }}
      />
      {/* Bottom vignette */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-40"
        style={{
          background:
            "linear-gradient(to top, oklch(0.09 0.025 230 / 0.7), transparent)",
        }}
      />
      {/* Film-grain texture — adds depth */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
        }}
      />

      {/* ── Content ── */}
      <Container className="relative z-10 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-10 py-20 lg:py-24 xl:py-28">
          {/* Text column */}
          <div className="flex-1 text-center lg:text-left max-w-2xl">
            {/* Eyebrow badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-1.5 mb-6 backdrop-blur-sm"
              style={{ animation: "fade-in-up 0.5s ease-out 0.1s both" }}
            >
              <Sparkles className="size-3.5 text-primary" aria-hidden />
              <span className="text-caption font-medium text-white/80">
                New arrivals every week
              </span>
            </div>

            {/* Headline — swaps per slide */}
            <h1
              key={active}
              className="font-bold tracking-tight mb-5 text-white"
              style={{
                fontSize: "clamp(2.1rem, 3.8vw + 1rem, 3.8rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                animation: "fade-in-up 0.5s ease-out both",
              }}
            >
              {SLIDES[active].headline}
            </h1>

            {/* Subtext */}
            <p
              className="text-body-lg text-white/65 mb-8 max-w-[42ch] mx-auto lg:mx-0"
              style={{ animation: "fade-in-up 0.6s ease-out 0.2s both" }}
            >
              Genuine gadgets. Transparent pricing. Bank transfer payment
              confirmed by a real person — usually within 2 hours.
            </p>

            {/* CTAs */}
            <div
              className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
              style={{ animation: "fade-in-up 0.6s ease-out 0.3s both" }}
            >
              <Link
                href="/category/phones"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "gap-2 shadow-xl shadow-primary/25 hover:shadow-primary/45 transition-shadow",
                )}
              >
                Shop Now <ArrowRight className="size-4" />
              </Link>
              <Link
                href="#categories"
                className="inline-flex items-center justify-center h-11 px-6 rounded-lg border border-white/20 bg-white/[0.07] text-body text-white/80 backdrop-blur-sm hover:bg-white/[0.14] hover:border-white/35 transition-all duration-200 font-medium"
              >
                Browse Categories
              </Link>
            </div>

            {/* Trust micro-strip */}
            <div
              className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-8 justify-center lg:justify-start"
              style={{ animation: "fade-in-up 0.6s ease-out 0.4s both" }}
            >
              {[
                "Genuine products",
                "Manual payment confirm",
                "Nationwide delivery",
              ].map((item) => (
                <span
                  key={item}
                  className="flex items-center gap-1.5 text-caption text-white/45"
                >
                  <span className="size-1.5 rounded-full bg-primary/70 flex-shrink-0" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Stats card — desktop, floats on the right over the image */}
          <div
            className="hidden lg:flex flex-col gap-3 flex-shrink-0 w-56 xl:w-64"
            style={{ animation: "fade-in 0.9s ease-out 0.5s both" }}
            aria-hidden
          >
            {[
              { value: "5,000+", label: "Products in stock" },
              { value: "₦0", label: "Hidden fees" },
              { value: "2 hrs", label: "Avg. payment confirm" },
              { value: "100%", label: "Genuine items" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-md px-5 py-4 hover:bg-white/[0.1] transition-colors"
              >
                <p className="text-h3 font-bold text-primary">{stat.value}</p>
                <p className="text-caption text-white/55 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>

      {/* ── Controls ── */}
      {/* Prev / Next arrows */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.07] text-white backdrop-blur-sm hover:bg-white/[0.18] transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.07] text-white backdrop-blur-sm hover:bg-white/[0.18] transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight className="size-5" />
      </button>

      {/* Dot indicators + progress bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300 ease-out",
              i === active
                ? "w-8 bg-primary"
                : "w-2 bg-white/35 hover:bg-white/60",
            )}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === active ? "true" : undefined}
          />
        ))}
      </div>

      {/* Slide counter */}
      <div className="absolute bottom-5 right-6 z-10 text-caption text-white/35 tabular-nums">
        {String(active + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
      </div>

      <style>{`
        .hero-gradient-text {
          background: linear-gradient(90deg, oklch(0.75 0.14 195), oklch(0.85 0.10 180));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
    </section>
  );
}
