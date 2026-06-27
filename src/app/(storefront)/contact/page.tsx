import type { Metadata } from "next";
import Link from "next/link";
import {
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Clock,
  Banknote,
  ExternalLink,
} from "lucide-react";

import { Container } from "@/components/layout/container";
import { ContactForm } from "@/components/storefront/contact-form";
import { getSettings } from "@/lib/settings";
import { telHref, waHref, formatPhoneDisplay } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contact Us — OCare Phinas Integrated Services",
  description:
    "Get in touch with Ocare Phinas Integrated Services. Reach us by phone, WhatsApp, or email for orders, payments, deliveries, and Pay Small Small plans.",
  openGraph: {
    title: "Contact Us — OCare Phinas Integrated Services",
    description: "We're here to help — reach us by phone, WhatsApp, or email.",
  },
};

/** Contact channels — phone + WhatsApp come from admin Settings (whatsappNumber). */
function buildChannels(whatsappNumber: string) {
  return [
    {
      icon: Phone,
      label: "Call us",
      value: formatPhoneDisplay(whatsappNumber),
      href: telHref(whatsappNumber),
      note: "Mon–Sat, business hours",
    },
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: "Chat with us",
      href: waHref(whatsappNumber),
      note: "Fastest way to reach us",
      external: true,
    },
    {
      icon: Mail,
      label: "Email",
      value: "support@ocarephinas.com",
      href: "mailto:support@ocarephinas.com",
      note: "We reply within 24 hours",
    },
  ];
}

const HOURS = [
  { day: "Monday – Friday", time: "8:00 AM – 6:00 PM" },
  { day: "Saturday", time: "9:00 AM – 4:00 PM" },
  { day: "Sunday & Public Holidays", time: "Closed" },
];

export default async function ContactPage() {
  const { whatsappNumber } = await getSettings();
  const CHANNELS = buildChannels(whatsappNumber);
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-muted/30">
        <div
          aria-hidden
          className="absolute -right-24 -top-24 size-80 rounded-full bg-primary/10 blur-3xl"
        />
        <Container className="relative py-16 sm:py-20">
          <nav className="text-caption text-muted-foreground mb-3" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span className="mx-1.5">/</span>
            <span className="text-foreground">Contact Us</span>
          </nav>
          <p className="text-caption font-semibold uppercase tracking-widest text-primary mb-2">
            Contact Us
          </p>
          <h1
            className="font-bold tracking-tight"
            style={{ fontSize: "clamp(2rem, 1.5rem + 2.5vw, 3rem)", lineHeight: 1.12 }}
          >
            We&apos;d love to hear from you
          </h1>
          <p className="text-body-lg text-muted-foreground mt-5 max-w-[56ch]">
            Questions about an order, a payment, or a Pay Small Small plan? Our team is ready to
            help — reach out through whichever channel is most convenient for you.
          </p>
        </Container>
      </section>

      <section className="py-14 sm:py-16">
        <Container>
          {/* Channels */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
            {CHANNELS.map((c) => {
              const Icon = c.icon;
              return (
                <a
                  key={c.label}
                  href={c.href}
                  target={c.external ? "_blank" : undefined}
                  rel={c.external ? "noopener noreferrer" : undefined}
                  className="group flex flex-col rounded-2xl border border-border bg-card p-6 hover:border-primary/40 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 mb-4 group-hover:bg-primary/15 transition-colors">
                    <Icon className="size-6 text-primary" aria-hidden />
                  </div>
                  <p className="text-caption font-semibold uppercase tracking-wide text-muted-foreground">
                    {c.label}
                  </p>
                  <p className="text-body font-semibold mt-0.5 inline-flex items-center gap-1.5 group-hover:text-primary transition-colors">
                    {c.value}
                    {c.external && <ExternalLink className="size-3.5" aria-hidden />}
                  </p>
                  <p className="text-caption text-muted-foreground mt-1">{c.note}</p>
                </a>
              );
            })}
          </div>

          {/* Form + sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Form */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <h2 className="text-h3 font-bold mb-1">Send us a message</h2>
                <p className="text-body-sm text-muted-foreground mb-6">
                  Fill out the form and we&apos;ll get back to you as soon as possible.
                </p>
                <ContactForm />
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Location */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-2.5 mb-3">
                  <MapPin className="size-5 text-primary" aria-hidden />
                  <h3 className="text-body font-semibold">Visit us</h3>
                </div>
                <p className="text-body-sm text-muted-foreground leading-relaxed">
                  Ocare Phinas Integrated Services
                  <br />
                  Lagos, Nigeria
                </p>
              </div>

              {/* Hours */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-2.5 mb-3">
                  <Clock className="size-5 text-primary" aria-hidden />
                  <h3 className="text-body font-semibold">Business hours</h3>
                </div>
                <ul className="space-y-2">
                  {HOURS.map((h) => (
                    <li key={h.day} className="flex justify-between gap-4 text-body-sm">
                      <span className="text-muted-foreground">{h.day}</span>
                      <span className="font-medium text-right">{h.time}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Payment note */}
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
                <div className="flex items-center gap-2.5 mb-3">
                  <Banknote className="size-5 text-primary" aria-hidden />
                  <h3 className="text-body font-semibold">How payment works</h3>
                </div>
                <p className="text-caption text-muted-foreground leading-relaxed">
                  We accept bank transfers. After paying, send your payment screenshot on WhatsApp
                  with your order reference — we confirm manually, usually within 2 hours on
                  business days.
                </p>
              </div>
            </aside>
          </div>
        </Container>
      </section>
    </div>
  );
}
