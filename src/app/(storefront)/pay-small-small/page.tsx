import type { Metadata } from "next";
import Link from "next/link";
import { Users, User, CheckCircle, HelpCircle, Wallet, Sparkles } from "lucide-react";

import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pay Small Small — OCare Phinas",
  description: "Own any item by paying ₦1,000 a day per slot. Start a solo plan (no price cap) or join a group for items up to ₦100,000. No interest, no withdrawals — your money only ever becomes a product.",
};

const HOW_IT_WORKS = [
  { step: "1", title: "Pick your item", body: "Choose anything you want. We work out the slots: price ÷ ₦50,000, rounded up." },
  { step: "2", title: "Pay ₦1,000 per slot, daily", body: "Each slot is ₦1,000 a day for 50 days. The daily amount is fixed — no paying ahead, no guesswork." },
  { step: "3", title: "Pay & we track", body: "Transfer each day's amount to our bank and send your screenshot on WhatsApp. We confirm and update your ledger." },
  { step: "4", title: "Get your item", body: "Solo plans deliver at 50%, then you finish the balance. Group items arrive in position order as funds build." },
];

const FAQS = [
  {
    q: "How much do I pay, and how often?",
    a: "It's worked out from the price. One slot is ₦1,000 every day; the number of slots is the price divided by ₦50,000, rounded up (so a ₦120,000 item is 3 slots = ₦3,000/day). You pay exactly that daily amount — there's no paying ahead.",
  },
  {
    q: "When do I get my item?",
    a: "On a solo plan, once you've paid half (50%) of the price we deliver it, and you finish the balance afterwards. In a group, items are delivered in position order as the group's funds build.",
  },
  {
    q: "Can I get my money back as cash?",
    a: "No — and that's by design. Money you pay in can only ever become a product, now or later. There are no cash withdrawals anywhere in the system. Any surplus stays in your wallet's available balance for another item.",
  },
  {
    q: "What happens if I miss a payment?",
    a: "Missing a day just pauses your progress — there are no penalties or late fees. Continue when you can. We encourage consistency, but life happens.",
  },
  {
    q: "What's the difference between a solo plan and a group plan?",
    a: "A solo plan is just you, with no price cap — pick any item and pay ₦1,000 per slot daily, delivered at 50%. A group plan is a shared slot pool for items up to ₦100,000 (1 or 2 slots each), where members receive their item in position order. You can run several plans at once.",
  },
  {
    q: "Is this mandatory to shop?",
    a: "Absolutely not. Pay Small Small is completely optional — you can buy any item outright instead. Joining a plan never blocks an outright purchase.",
  },
];

export default function PSSLandingPage() {
  return (
    <div>
      {/* Hero */}
      <section
        className="py-20 sm:py-24 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, oklch(0.50 0.15 150) 0%, oklch(0.45 0.14 150) 50%, oklch(0.55 0.14 100) 100%)",
        }}
      >
        <div aria-hidden className="absolute -right-24 top-0 size-96 rounded-full opacity-15 blur-3xl" style={{ background: "oklch(0.72 0.17 78)" }} />
        <div aria-hidden className="absolute -left-12 bottom-0 size-64 rounded-full opacity-10 blur-2xl" style={{ background: "oklch(0.72 0.17 78)" }} />

        <Container className="relative z-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 mb-6 backdrop-blur-sm">
            <Sparkles className="size-3.5 text-yellow-300" />
            <span className="text-caption font-medium text-white/90">Completely optional · No interest · No hidden fees</span>
          </div>
          <h1
            className="font-bold text-white mb-5 mx-auto"
            style={{ fontSize: "clamp(2rem, 4vw + 1rem, 3.5rem)", lineHeight: 1.1, maxWidth: "18ch" }}
          >
            Own quality gadgets the{" "}
            <span style={{ background: "linear-gradient(90deg, oklch(0.88 0.15 80), oklch(0.95 0.12 90))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              easy way
            </span>
          </h1>
          <p className="text-body-lg text-white/80 mb-10 max-w-[46ch] mx-auto">
            Pick any item and pay ₦1,000 a day per slot. Solo plans deliver at 50% with no price cap; groups cover items up to ₦100,000. No interest, no withdrawals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pay-small-small/solo"
              className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl font-semibold text-body text-primary bg-white hover:bg-white/90 transition-colors"
            >
              <User className="size-5" /> Start a Solo Plan
            </Link>
            <Link
              href="/pay-small-small/join"
              className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl font-semibold text-body text-white border border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
            >
              <Users className="size-5" /> Join a Group
            </Link>
          </div>
        </Container>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-heading" className="py-16 sm:py-20 bg-background">
        <Container>
          <div className="text-center mb-12">
            <p className="text-caption font-semibold uppercase tracking-widest text-primary mb-1">Simple process</p>
            <h2 id="how-heading" className="text-h1 font-bold">How it works</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="relative flex flex-col items-center text-center p-6 rounded-2xl border border-border bg-card">
                <div
                  className="flex size-12 items-center justify-center rounded-full text-white font-bold text-body mb-4"
                  style={{ background: "linear-gradient(135deg, oklch(0.50 0.15 150), oklch(0.55 0.14 100))" }}
                >
                  {item.step}
                </div>
                <h3 className="text-body font-semibold mb-2">{item.title}</h3>
                <p className="text-body-sm text-muted-foreground leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Group vs Solo */}
      <section aria-labelledby="plans-heading" className="py-16 sm:py-20 bg-muted/40">
        <Container className="max-w-3xl">
          <div className="text-center mb-10">
            <h2 id="plans-heading" className="text-h1 font-bold">Choose your plan</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Solo — primary / recommended */}
            <div className="relative rounded-2xl border-2 border-primary bg-card p-6 flex flex-col">
              <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-micro font-semibold text-white">
                Recommended
              </span>
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                <User className="size-6 text-primary" />
              </div>
              <h3 className="text-h3 font-bold mb-2">Solo Plan</h3>
              <p className="text-body-sm text-muted-foreground mb-5 flex-1">
                Own anything, just you — no price cap. Pick an item and pay ₦1,000 per slot every day (slots = price ÷ ₦50,000, rounded up). We deliver once you reach the halfway mark, then you finish the balance.
              </p>
              <ul className="space-y-2 mb-6">
                {["Any item, no price cap", "₦1,000 per slot, daily", "Delivered at 50% paid", "Run several plans at once"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-body-sm">
                    <CheckCircle className="size-4 text-primary flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/pay-small-small/solo" className={cn(buttonVariants(), "w-full gap-2 justify-center")}>
                <User className="size-4" /> Start a Solo Plan
              </Link>
            </div>

            {/* Group — secondary */}
            <div className="rounded-2xl border border-border bg-card p-6 flex flex-col">
              <div className="flex size-12 items-center justify-center rounded-xl bg-accent/10 mb-4">
                <Users className="size-6 text-accent" />
              </div>
              <h3 className="text-h3 font-bold mb-2">Group Plan</h3>
              <p className="text-body-sm text-muted-foreground mb-5 flex-1">
                For items up to ₦100,000. Join a shared slot pool and take 1 or 2 slots (₦1,000 each, daily). Members receive their item in position order as the group&apos;s funds build — no chat, just progress.
              </p>
              <ul className="space-y-2 mb-6">
                {["Items up to ₦100,000", "₦1,000 per slot, 1 or 2 slots", "Delivered by group position", "Group closes when full"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-body-sm">
                    <CheckCircle className="size-4 text-accent flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/pay-small-small/join" className={cn(buttonVariants({ variant: "outline" }), "w-full gap-2 justify-center")}>
                <Users className="size-4" /> Join a Group
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-heading" className="py-16 sm:py-20 bg-background">
        <Container className="max-w-2xl">
          <div className="text-center mb-10">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 mx-auto mb-4">
              <HelpCircle className="size-6 text-primary" />
            </div>
            <h2 id="faq-heading" className="text-h1 font-bold">Frequently asked questions</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <div key={faq.q} className="rounded-xl border border-border bg-card p-5">
                <p className="text-body-sm font-semibold mb-2">{faq.q}</p>
                <p className="text-body-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <p className="text-body-sm text-muted-foreground mb-4">Still have questions?</p>
            <a
              href="https://wa.me/2340000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-body-sm font-semibold text-white hover:bg-[#1eb85a] transition-colors"
            >
              <Wallet className="size-4" /> Chat with us on WhatsApp
            </a>
          </div>
        </Container>
      </section>
    </div>
  );
}
