import type { Metadata } from "next";
import Link from "next/link";
import {
  ShoppingBag,
  Users,
  Wallet,
  Target,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  HeartHandshake,
  BadgeCheck,
} from "lucide-react";

import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About Us — OCare Phinas Integrated Services",
  description:
    "Ocare Phinas Integrated Services makes quality living more accessible through flexible, trusted, and convenient shopping — direct purchases, structured payment plans, and contribution-based savings.",
  openGraph: {
    title: "About Us — OCare Phinas Integrated Services",
    description:
      "Flexible, trusted, and convenient ways to own home appliances, electronics, and everyday essentials in Nigeria.",
  },
};

const FLEX_OPTIONS = [
  {
    icon: ShoppingBag,
    title: "Shop directly from our store",
    description: "Browse the catalog and buy what you need right away.",
  },
  {
    icon: Users,
    title: "Join contribution groups",
    description: "Save together with others and claim quality products as a group.",
  },
  {
    icon: Wallet,
    title: "Start personal payment plans",
    description: "Pay gradually on your own schedule — no interest, no pressure.",
  },
  {
    icon: Target,
    title: "Work towards purchase milestones",
    description: "Reach individual goals at your own pace, step by step.",
  },
];

const REASONS = [
  "Flexible payment options",
  "Direct shopping convenience",
  "Structured savings and milestone plans",
  "Trusted and transparent process",
  "Verified customer deliveries",
  "Reliable customer support",
  "Quality products at accessible prices",
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-muted/30">
        <div
          aria-hidden
          className="absolute -right-24 -top-24 size-80 rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -left-16 bottom-0 size-56 rounded-full bg-accent/10 blur-3xl"
        />
        <Container className="relative py-16 sm:py-20">
          <nav className="text-caption text-muted-foreground mb-3" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span className="mx-1.5">/</span>
            <span className="text-foreground">About Us</span>
          </nav>
          <p className="text-caption font-semibold uppercase tracking-widest text-primary mb-2">
            About Us
          </p>
          <h1
            className="font-bold tracking-tight max-w-3xl"
            style={{ fontSize: "clamp(2rem, 1.5rem + 2.5vw, 3rem)", lineHeight: 1.12 }}
          >
            Making quality living more{" "}
            <span className="text-primary">accessible</span>
          </h1>
          <p className="text-body-lg text-muted-foreground mt-5 max-w-[60ch]">
            At Ocare Phinas Integrated Services, we are committed to making quality living more
            accessible through flexible, trusted, and convenient shopping solutions.
          </p>
        </Container>
      </section>

      {/* Intro */}
      <section className="py-14 sm:py-16">
        <Container className="max-w-3xl">
          <div className="space-y-5 text-body text-muted-foreground leading-relaxed">
            <p>
              We provide individuals and families with easier ways to own home appliances,
              electronics, and everyday essentials — whether through direct purchases, structured
              payment plans, or contribution-based savings options tailored to different financial
              needs.
            </p>
            <p className="text-foreground font-medium">Our platform is designed for flexibility.</p>
          </div>
        </Container>
      </section>

      {/* Flexible options */}
      <section className="pb-14 sm:pb-16">
        <Container>
          <div className="mb-8 text-center">
            <h2 className="text-h2 font-bold">Customers can choose to</h2>
            <p className="text-body-sm text-muted-foreground mt-2 max-w-[52ch] mx-auto">
              Whether you prefer to shop immediately, pay gradually, or achieve your goals step by
              step — the choice is yours.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FLEX_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <div
                  key={opt.title}
                  className="flex flex-col rounded-2xl border border-border bg-card p-6 hover:border-primary/40 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                    <Icon className="size-6 text-primary" aria-hidden />
                  </div>
                  <h3 className="text-body font-semibold mb-1.5">{opt.title}</h3>
                  <p className="text-body-sm text-muted-foreground leading-relaxed">
                    {opt.description}
                  </p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Values / commitment */}
      <section className="py-14 sm:py-16 bg-muted/40 border-y border-border">
        <Container className="max-w-3xl">
          <div className="space-y-5 text-body text-muted-foreground leading-relaxed">
            <p>
              Whether you prefer to shop immediately, pay gradually, or achieve your goals step by
              step, Ocare Phinas Integrated Services is here to make the process simple, reliable,
              and convenient.
            </p>
            <p>
              Built on trust, transparency, and customer satisfaction, we are focused on creating a
              reliable system that makes it easier for people to access the products they need
              without unnecessary financial pressure.
            </p>
            <p>
              At Ocare Phinas Integrated Services, every successful delivery reflects our commitment
              to consistency, accountability, and dependable service. We combine affordability with
              structure, helping our customers plan smarter while enjoying quality products and a
              smooth shopping experience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
            {[
              { icon: HeartHandshake, label: "Trust" },
              { icon: ShieldCheck, label: "Transparency" },
              { icon: BadgeCheck, label: "Customer Satisfaction" },
            ].map((v) => {
              const Icon = v.icon;
              return (
                <div
                  key={v.label}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5"
                >
                  <Icon className="size-5 text-primary flex-shrink-0" aria-hidden />
                  <span className="text-body-sm font-semibold">{v.label}</span>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Why customers choose us */}
      <section className="py-14 sm:py-16">
        <Container>
          <div className="mb-8 text-center">
            <p className="text-caption font-semibold uppercase tracking-widest text-primary mb-1">
              The OCare Phinas difference
            </p>
            <h2 className="text-h2 font-bold">Why Customers Choose Us</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {REASONS.map((reason) => (
              <div
                key={reason}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors"
              >
                <CheckCircle2 className="size-5 text-primary flex-shrink-0" aria-hidden />
                <span className="text-body-sm font-medium">{reason}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Closing CTA */}
      <section className="pb-16 sm:pb-20">
        <Container>
          <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-primary/5 p-10 sm:p-14 text-center">
            <div
              aria-hidden
              className="absolute -right-20 -top-20 size-64 rounded-full bg-primary/10 blur-3xl"
            />
            <div className="relative">
              <h2 className="text-h2 font-bold mb-2">Ocare Phinas Integrated Services</h2>
              <p className="text-body-lg text-muted-foreground mb-8">
                Making it easier to get what you need.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/products" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
                  Start shopping <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/pay-small-small"
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }), "gap-2")}
                >
                  <Wallet className="size-4" /> Explore Pay Small Small
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
