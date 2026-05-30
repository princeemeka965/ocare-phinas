import type { Metadata } from "next";
import Link from "next/link";
import { Users, User, CheckCircle, HelpCircle, Wallet, Sparkles } from "lucide-react";

import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pay Small Small — OCare Phinas",
  description: "Save a little daily and own quality electronics. Join a group or start your own solo plan — no interest, no stress.",
};

const HOW_IT_WORKS = [
  { step: "1", title: "Choose your path", body: "Join a group with up to 10 members, or start your own solo plan." },
  { step: "2", title: "Pay ₦1,000 daily", body: "Transfer the daily amount to our bank account and send your screenshot on WhatsApp." },
  { step: "3", title: "We confirm & track", body: "Our team confirms your payment and updates your progress ledger, usually within 2 hours." },
  { step: "4", title: "Reach your target", body: "After 50 days (₦50,000 total), pick your item and we arrange fulfilment and delivery." },
];

const FAQS = [
  {
    q: "What happens if I miss a day?",
    a: "Missing a day just pauses your progress — there are no penalties or late fees. Simply continue paying when you can. We encourage consistency, but life happens.",
  },
  {
    q: "How are payments confirmed?",
    a: "Transfer the daily amount to our bank account, include your plan reference in the narration, then send your payment screenshot on WhatsApp. Our team confirms it and updates your ledger.",
  },
  {
    q: "Is joining mandatory to shop?",
    a: "Absolutely not. Pay Small Small is completely optional. You can browse and buy normally without ever joining a plan.",
  },
  {
    q: "How do I pick my item at the end?",
    a: "When your target is reached, your plan is marked complete and our team contacts you to arrange fulfilment — just like a normal order.",
  },
  {
    q: "What's the difference between a group plan and a solo plan?",
    a: "Group plans let you join with up to 9 other members — it's social motivation, though members don't chat or interact. Solo plans are entirely independent, just you and your savings goal.",
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
          <p className="text-body-lg text-white/80 mb-10 max-w-[44ch] mx-auto">
            Pay ₦1,000 daily for 50 days and claim a genuine gadget worth up to ₦50,000. Join a group or go solo — the choice is yours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pay-small-small/join"
              className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl font-semibold text-body text-primary bg-white hover:bg-white/90 transition-colors"
            >
              <Users className="size-5" /> Join a Group
            </Link>
            <Link
              href="/pay-small-small/solo"
              className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl font-semibold text-body text-white border border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
            >
              <User className="size-5" /> Start a Solo Plan
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
            {/* Group */}
            <div className="rounded-2xl border-2 border-primary bg-card p-6 flex flex-col">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                <Users className="size-6 text-primary" />
              </div>
              <h3 className="text-h3 font-bold mb-2">Group Plan</h3>
              <p className="text-body-sm text-muted-foreground mb-5 flex-1">
                Join a group of up to 10 members. Each member saves independently — there&apos;s no chat or interaction, just shared motivation. Groups close automatically when full.
              </p>
              <ul className="space-y-2 mb-6">
                {["Up to 10 members per group", "Group closes when full", "Profile tag: Group #G-013", "No member interaction"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-body-sm">
                    <CheckCircle className="size-4 text-primary flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/pay-small-small/join" className={cn(buttonVariants(), "w-full gap-2 justify-center")}>
                <Users className="size-4" /> Join a Group
              </Link>
            </div>

            {/* Solo */}
            <div className="rounded-2xl border border-border bg-card p-6 flex flex-col">
              <div className="flex size-12 items-center justify-center rounded-xl bg-accent/10 mb-4">
                <User className="size-6 text-accent" />
              </div>
              <h3 className="text-h3 font-bold mb-2">Solo Plan</h3>
              <p className="text-body-sm text-muted-foreground mb-5 flex-1">
                Go at your own pace, entirely on your own. Pick a target item or value and save until you hit your goal — no group needed.
              </p>
              <ul className="space-y-2 mb-6">
                {["Just you, no group", "Pick your own target item", "Profile tag: Solo Plan", "Start anytime"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-body-sm">
                    <CheckCircle className="size-4 text-accent flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/pay-small-small/solo" className={cn(buttonVariants({ variant: "outline" }), "w-full gap-2 justify-center")}>
                <User className="size-4" /> Start a Solo Plan
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
