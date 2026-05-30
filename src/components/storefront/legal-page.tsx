import type { ReactNode } from "react";
import Link from "next/link";

import { Container } from "@/components/layout/container";

export interface LegalSection {
  id: string;
  heading: string;
  body: ReactNode;
}

/**
 * Shared layout for long-form legal pages (Privacy Policy, Terms & Conditions).
 * Renders a hero, a sticky table of contents, and numbered content sections.
 */
export function LegalPage({
  title,
  breadcrumb,
  intro,
  lastUpdated,
  sections,
}: {
  title: string;
  breadcrumb: string;
  intro: string;
  lastUpdated: string;
  sections: LegalSection[];
}) {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-muted/30">
        <div
          aria-hidden
          className="absolute -right-24 -top-24 size-80 rounded-full bg-primary/10 blur-3xl"
        />
        <Container className="relative py-14 sm:py-16">
          <nav className="text-caption text-muted-foreground mb-3" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span className="mx-1.5">/</span>
            <span className="text-foreground">{breadcrumb}</span>
          </nav>
          <h1
            className="font-bold tracking-tight"
            style={{ fontSize: "clamp(1.875rem, 1.5rem + 2vw, 2.75rem)", lineHeight: 1.14 }}
          >
            {title}
          </h1>
          <p className="text-body text-muted-foreground mt-4 max-w-[64ch]">{intro}</p>
          <p className="text-caption text-muted-foreground mt-4">
            Last updated: <span className="font-medium text-foreground">{lastUpdated}</span>
          </p>
        </Container>
      </section>

      <section className="py-12 sm:py-16">
        <Container>
          <div className="flex flex-col lg:flex-row gap-10 xl:gap-16">
            {/* Table of contents */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="lg:sticky lg:top-24">
                <p className="text-caption font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  On this page
                </p>
                <nav aria-label="Table of contents">
                  <ol className="space-y-1.5">
                    {sections.map((s, i) => (
                      <li key={s.id}>
                        <a
                          href={`#${s.id}`}
                          className="flex gap-2 text-body-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          <span className="tabular-nums text-muted-foreground/60">{i + 1}.</span>
                          {s.heading}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              </div>
            </aside>

            {/* Content */}
            <div className="flex-1 min-w-0 max-w-3xl">
              <div className="space-y-10">
                {sections.map((s, i) => (
                  <section key={s.id} id={s.id} className="scroll-mt-24">
                    <h2 className="text-h3 font-bold mb-3 flex items-baseline gap-2">
                      <span className="text-primary tabular-nums">{i + 1}.</span>
                      {s.heading}
                    </h2>
                    <div className="space-y-3 text-body-sm text-muted-foreground leading-relaxed [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_strong]:text-foreground [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
                      {s.body}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
