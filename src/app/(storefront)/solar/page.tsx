"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sun,
  ShieldCheck,
  FileCheck2,
  Wallet,
  Wrench,
  CalendarClock,
  ArrowRight,
  CheckCircle,
  BadgeInfo,
} from "lucide-react";

import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useUserStore } from "@/store/userStore";
import { naira, SOLO_FREQUENCIES } from "@/lib/pay-small-small";
import { SOLAR_STATUS_META, packageBalance } from "@/lib/solar";
import type { SolarApplication, SolarPackage } from "@/lib/db/types";

const HOW_IT_WORKS = [
  { step: "1", title: "Apply", body: "Submit your KYC — address, ID, utility bill and employment details — then pay the ₦5,000 registration fee.", icon: FileCheck2 },
  { step: "2", title: "Get verified", body: "Our team reviews your application. Approved applicants are prompted to pay the initial deposit.", icon: ShieldCheck },
  { step: "3", title: "Get installed", body: "Once your deposit is confirmed we schedule a real installation date and time at your address.", icon: Wrench },
  { step: "4", title: "Repay the balance", body: "Clear the remaining balance on your chosen cadence — daily, weekly or monthly — after installation.", icon: CalendarClock },
];

const PROTECTION_RULES = [
  "The ₦5,000 registration fee is non-refundable.",
  "Approval is subject to successful KYC verification.",
  "Installation only begins after your deposit is confirmed.",
  "You agree to complete the full repayment plan.",
  "Default may affect your eligibility for future solar plans.",
];

export default function SolarPackagesPage() {
  const user = useUserStore((s) => s.user);
  const [packages, setPackages] = useState<SolarPackage[] | null>(null);
  const [myApplication, setMyApplication] = useState<SolarApplication | null>(null);

  useEffect(() => {
    api.get<{ packages: SolarPackage[] }>("/api/solar/packages").then((d) => setPackages(d.packages)).catch(() => setPackages([]));
  }, []);

  useEffect(() => {
    if (!user) return;
    api
      .get<{ application: SolarApplication | null }>("/api/solar/application")
      .then((d) => setMyApplication(d.application))
      .catch(() => {});
  }, [user]);

  return (
    <div>
      {/* Hero */}
      <section
        className="py-20 sm:py-24 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, oklch(0.50 0.15 150) 0%, oklch(0.45 0.14 150) 50%, oklch(0.62 0.15 60) 100%)" }}
      >
        <div aria-hidden className="absolute -right-24 top-0 size-96 rounded-full opacity-15 blur-3xl" style={{ background: "oklch(0.75 0.17 70)" }} />
        <div aria-hidden className="absolute -left-12 bottom-0 size-64 rounded-full opacity-10 blur-2xl" style={{ background: "oklch(0.72 0.17 78)" }} />

        <Container className="relative z-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 mb-6 backdrop-blur-sm">
            <Sun className="size-3.5 text-yellow-300" />
            <span className="text-caption font-medium text-white/90">Solar Power Flex Plan</span>
          </div>
          <h1 className="font-bold text-white mb-5 mx-auto" style={{ fontSize: "clamp(2rem, 4vw + 1rem, 3.5rem)", lineHeight: 1.1, maxWidth: "20ch" }}>
            Power your home with solar — the easy way
          </h1>
          <p className="text-body-lg text-white/80 mb-10 max-w-[52ch] mx-auto">
            A small deposit gets your system installed. Clear the balance afterwards on a pace that
            works for you — daily, weekly or monthly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {myApplication ? (
              <Link
                href="/solar/application"
                className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl font-semibold text-body text-primary bg-white hover:bg-white/90 transition-colors"
              >
                <Sun className="size-5" /> View My Application
              </Link>
            ) : packages === null ? null : packages.length > 0 ? (
              <Link
                href="/solar/apply"
                className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl font-semibold text-body text-primary bg-white hover:bg-white/90 transition-colors"
              >
                <Sun className="size-5" /> Apply Now
              </Link>
            ) : (
              <p className="text-body-sm text-white/80">No solar packages are available right now.</p>
            )}
          </div>
        </Container>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-20 bg-background">
        <Container>
          <div className="text-center mb-12">
            <p className="text-caption font-semibold uppercase tracking-widest text-primary mb-1">Simple process</p>
            <h2 className="text-h1 font-bold">How it works</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="relative flex flex-col items-center text-center p-6 rounded-2xl border border-border bg-card">
                  <div
                    className="flex size-12 items-center justify-center rounded-full text-white font-bold text-body mb-4"
                    style={{ background: "linear-gradient(135deg, oklch(0.50 0.15 150), oklch(0.62 0.15 60))" }}
                  >
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-body font-semibold mb-2">{item.title}</h3>
                  <p className="text-body-sm text-muted-foreground leading-relaxed">{item.body}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Packages */}
      <section className="py-16 sm:py-20 bg-muted/40">
        <Container className="max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-h1 font-bold">Available packages</h2>
            <p className="text-body-sm text-muted-foreground mt-2">Pick a package, then choose how you&apos;d like to repay the balance.</p>
          </div>

          {packages === null ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-body-sm text-muted-foreground">
              Loading packages…
            </div>
          ) : packages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-body-sm text-muted-foreground">
              No solar packages are available right now.
            </div>
          ) : (
            <div className="space-y-6">
              {packages.map((pkg) => (
                <div key={pkg.id} className="rounded-2xl border-2 border-primary bg-card p-6 sm:p-8">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0">
                      <Sun className="size-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-h3 font-bold">{pkg.name}</h3>
                      <p className="text-body-sm text-muted-foreground mt-1">{pkg.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {[
                      { label: "Registration fee", value: naira(pkg.registrationFee), note: "non-refundable" },
                      { label: "Initial deposit", value: naira(pkg.initialDeposit) },
                      { label: "Balance", value: naira(packageBalance(pkg)) },
                      { label: "Total", value: naira(pkg.totalAmount) },
                    ].map((cell) => (
                      <div key={cell.label} className="rounded-xl border border-border bg-muted/40 p-3">
                        <p className="text-micro text-muted-foreground uppercase tracking-wide">{cell.label}</p>
                        <p className="text-body-sm font-bold">{cell.value}</p>
                        {cell.note && <p className="text-micro text-muted-foreground">{cell.note}</p>}
                      </div>
                    ))}
                  </div>

                  <p className="text-caption font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Choose your repayment cadence
                  </p>
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    {pkg.cadenceOptions.map((c) => (
                      <div key={c.frequency} className="rounded-xl border border-border bg-background px-3 py-2.5 text-center">
                        <p className="text-body-sm font-bold">{naira(c.amount)}</p>
                        <p className="text-micro text-muted-foreground">{SOLO_FREQUENCIES[c.frequency].per}</p>
                      </div>
                    ))}
                  </div>

                  {myApplication ? (
                    <Link href="/solar/application" className={cn(buttonVariants({ size: "lg" }), "w-full gap-2 justify-center")}>
                      <ArrowRight className="size-4" /> View My Application ({SOLAR_STATUS_META[myApplication.status].label})
                    </Link>
                  ) : (
                    <Link href="/solar/apply" className={cn(buttonVariants({ size: "lg" }), "w-full gap-2 justify-center")}>
                      <Sun className="size-4" /> Apply Now
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* Protection rules */}
      <section className="py-16 sm:py-20 bg-background">
        <Container className="max-w-2xl">
          <div className="text-center mb-8">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 mx-auto mb-4">
              <BadgeInfo className="size-6 text-primary" />
            </div>
            <h2 className="text-h1 font-bold">Before you apply</h2>
          </div>
          <ul className="space-y-3">
            {PROTECTION_RULES.map((rule) => (
              <li key={rule} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-body-sm">
                <CheckCircle className="size-4 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{rule}</span>
              </li>
            ))}
          </ul>
          <div className="text-center mt-10">
            <Link href="/pay-small-small" className="inline-flex items-center gap-1.5 text-body-sm text-muted-foreground hover:text-primary transition-colors">
              <Wallet className="size-4" /> Looking for Solo or Group plans instead?
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
